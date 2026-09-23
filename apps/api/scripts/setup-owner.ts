// 最初の owner を設定する初期設定スクリプト（本番 D1 に直接書き込む）
//
// 使い方（Mac の Terminal.app などで、本人が実行する）:
//   cd apps/api
//   node scripts/setup-owner.ts                 # 初回
//   node scripts/setup-owner.ts --rotate-pepper # 復旧用: PIN_PEPPER を作り直す（他スタッフの PIN は無効になる）
//
// - PIN は画面に表示しない入力でだけ受け取る。コマンドライン引数・ファイル・ログには出さない。
// - PIN_PEPPER はここでランダムに生成し、Cloudflare API へ HTTPS のリクエスト本文で登録する。
//   生成した値はこのプロセスのメモリにだけあり、表示もファイル保存もしない。
// - 本番 DB への書き込みは、確認で yes と入力したあとにだけ行う。
// - Cloudflare の認証は wrangler のログイン情報（または環境変数 CLOUDFLARE_API_TOKEN）を使う。

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { hashPin, isValidPin, isWeakPin } from '../src/auth/pin.ts';

const WORKER_NAME = 'a10-hairsalon-api-prod';
// A10_CF_API_BASE はローカルでの動作テスト（Cloudflare API のモック）専用
const API = process.env.A10_CF_API_BASE || 'https://api.cloudflare.com/client/v4';

interface StaffRow { id: string; name: string; role: string; has_pin: number }

function fail(message: string): never {
  console.error(`\n中止しました: ${message}`);
  process.exit(1);
}

function parseArgs(): { rotatePepper: boolean } {
  const args = process.argv.slice(2);
  const unknown = args.filter((a) => a !== '--rotate-pepper');
  // PIN などを引数で渡されてシェル履歴に残らないよう、想定外の引数は受け付けない
  if (unknown.length > 0) fail('引数は --rotate-pepper 以外受け付けません。PIN は実行後の入力欄で入力してください。');
  return { rotatePepper: args.includes('--rotate-pepper') };
}

// ---- Cloudflare API ----

function wranglerConfigPath(): string {
  const candidates = [
    join(homedir(), 'Library', 'Preferences', '.wrangler', 'config', 'default.toml'),
    join(homedir(), '.wrangler', 'config', 'default.toml'),
    join(homedir(), '.config', '.wrangler', 'config', 'default.toml'),
  ];
  for (const path of candidates) {
    try { readFileSync(path); return path; } catch { /* 次の候補 */ }
  }
  fail('wrangler のログイン情報が見つかりません。先に `npx wrangler login` を実行してください。');
}

function getApiToken(): string {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  // wrangler のトークンは約1時間で切れるため、wrangler を1回実行して更新させる（出力は表示しない）
  spawnSync('npx', ['wrangler', 'whoami'], { stdio: 'ignore', cwd: process.cwd() });
  const toml = readFileSync(wranglerConfigPath(), 'utf8');
  const token = toml.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
  const expires = toml.match(/^expiration_time\s*=\s*"([^"]+)"/m)?.[1];
  if (!token) fail('wrangler にログインしていません。`npx wrangler login` を実行してください。');
  if (expires && new Date(expires).getTime() < Date.now()) {
    fail('wrangler のログインの有効期限が切れています。`npx wrangler login` を実行してください。');
  }
  return token;
}

async function cf<T>(token: string, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; result?: T; errors?: Array<{ message: string }> };
  if (!res.ok || data.success === false) {
    // リクエスト本文（PIN_PEPPER やハッシュを含みうる）は表示しない
    const messages = (data.errors || []).map((e) => e.message).join(' / ');
    fail(`Cloudflare API エラー (${method} ${path.replace(/\/secrets.*$/, '/secrets')}, HTTP ${res.status}) ${messages}`);
  }
  return data.result as T;
}

function productionDatabaseId(): string {
  const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  const section = toml.split('[[env.production.d1_databases]]')[1];
  const id = section?.match(/database_id\s*=\s*"([^"]+)"/)?.[1];
  if (!id) fail('wrangler.toml から本番 D1 の database_id を読み取れませんでした。');
  return id;
}

// ---- 端末入力 ----

async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

// 入力した文字を表示しない（* だけ表示する）
function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          process.stdout.write('\n');
          resolve(value);
          return;
        }
        if (ch === '\u0003') { // Ctrl+C
          stdin.setRawMode(false);
          process.stdout.write('\n');
          fail('キャンセルしました。本番 DB は変更していません。');
        }
        if (ch === '\u007f' || ch === '\b') {
          if (value.length > 0) { value = value.slice(0, -1); process.stdout.write('\b \b'); }
          continue;
        }
        value += ch;
        process.stdout.write('*');
      }
    };
    stdin.on('data', onData);
  });
}

async function askNewPin(): Promise<string> {
  for (let i = 0; i < 3; i++) {
    const pin = await askHidden('新しいPIN（6桁の数字）: ');
    if (!isValidPin(pin)) { console.log('PINは6桁の数字で入力してください。'); continue; }
    if (isWeakPin(pin)) { console.log('同じ数字の繰り返しや連番（123456 など）は使えません。'); continue; }
    const again = await askHidden('もう一度入力してください: ');
    if (pin !== again) { console.log('1回目と2回目が一致しません。'); continue; }
    return pin;
  }
  fail('PINの入力に3回失敗しました。本番 DB は変更していません。');
}

function randomPepper(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(bytes).toString('base64url');
}

// ---- 本体 ----

async function main() {
  const { rotatePepper } = parseArgs();
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    fail('このスクリプトはターミナル（Terminal.app など）から直接実行してください。PINを画面に表示せずに入力するために必要です。');
  }

  console.log('A10 Hairsalon: 最初の owner の設定\n');
  const token = getApiToken();
  const databaseId = productionDatabaseId();

  const accounts = await cf<Array<{ id: string; name: string }>>(token, 'GET', '/accounts');
  let accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
  if (!accountId) {
    if (accounts.length !== 1) fail('Cloudflare アカウントが複数あります。環境変数 CLOUDFLARE_ACCOUNT_ID で指定してください。');
    accountId = accounts[0].id;
  }

  const query = async <T>(sql: string, params: unknown[] = []) => {
    const result = await cf<Array<{ results: T[]; meta: { changes?: number } }>>(
      token, 'POST', `/accounts/${accountId}/d1/database/${databaseId}/query`, { sql, params }
    );
    return result[0];
  };

  // 0004_staff_auth.sql が適用済みか
  const columns = (await query<{ name: string }>('PRAGMA table_info(stylists)')).results.map((c) => c.name);
  if (!columns.includes('pin_hash') || !columns.includes('role')) {
    fail('本番 DB にマイグレーション 0004_staff_auth.sql が適用されていません。先に適用してください。');
  }

  const staff = (await query<StaffRow>(
    'SELECT id, name, role, (pin_hash IS NOT NULL) AS has_pin FROM stylists WHERE is_active = 1 ORDER BY created_at'
  )).results;
  if (staff.length === 0) fail('有効なスタッフがいません。先に管理画面でスタッフを登録してください。');

  const pinnedCount = staff.filter((s) => s.has_pin).length;
  if (pinnedCount > 0 && !rotatePepper) {
    fail(
      'すでにPINが設定されているスタッフがいます。PINの変更は管理画面から行ってください。\n' +
      'owner がログインできなくなった場合の復旧は --rotate-pepper を付けて実行してください（他スタッフのPINは無効になります）。'
    );
  }

  console.log('有効なスタッフ:');
  staff.forEach((s, i) => console.log(`  ${i + 1}. ${s.name}（役割: ${s.role}${s.has_pin ? '、PIN設定済み' : ''}）`));
  const choice = Number(await ask('\nowner にするスタッフの番号: '));
  const target = staff[choice - 1];
  if (!Number.isInteger(choice) || !target) fail('番号が正しくありません。本番 DB は変更していません。');

  const secrets = await cf<Array<{ name: string }>>(token, 'GET', `/accounts/${accountId}/workers/scripts/${WORKER_NAME}/secrets`);
  const pepperExists = secrets.some((s) => s.name === 'PIN_PEPPER');
  const bookmark = await cf<{ bookmark: string }>(token, 'GET', `/accounts/${accountId}/d1/database/${databaseId}/time_travel/bookmark`);
  const othersWithPin = staff.filter((s) => s.has_pin && s.id !== target.id);

  console.log('\n===== 実行内容の確認 =====');
  console.log(`本番 DB        : a10-hairsalon-prod (${databaseId})`);
  console.log(`Worker         : ${WORKER_NAME}`);
  console.log(`対象スタッフ   : ${target.name}（${target.id}）`);
  console.log(`役割           : ${target.role} → owner`);
  console.log('PIN            : この後の入力欄で設定（画面には表示しません）');
  console.log(`PIN_PEPPER     : ${pepperExists ? '作り直す（Workers Secret を上書き）' : '新しく生成して Workers Secret に登録'}`);
  if (rotatePepper) {
    console.log(`他のスタッフ   : PIN を無効化 ${othersWithPin.length} 名（${othersWithPin.map((s) => s.name).join('、') || 'なし'}）。管理画面から再設定が必要`);
  }
  console.log('セッション     : ログイン中のセッションはすべて無効化');
  console.log(`復元ポイント   : ${bookmark.bookmark}`);
  console.log(`  戻す場合: npx wrangler d1 time-travel restore a10-hairsalon-prod --env production --bookmark=${bookmark.bookmark}`);
  console.log('==========================\n');

  if ((await ask('この内容で本番に反映しますか？ 実行する場合は yes と入力: ')) !== 'yes') {
    fail('キャンセルしました。本番 DB は変更していません。');
  }

  let pin = await askNewPin();
  let pepper = randomPepper();
  const pinHash = await hashPin(pin, pepper);

  // 1. PIN_PEPPER を登録（Worker に新しいバージョンとして反映される）
  await cf(token, 'PUT', `/accounts/${accountId}/workers/scripts/${WORKER_NAME}/secrets`, {
    name: 'PIN_PEPPER', text: pepper, type: 'secret_text',
  });
  pin = '';
  pepper = '';

  // 2. 本番 DB を更新（値はパラメータで渡す）
  const now = Date.now();
  if (rotatePepper) {
    await query('UPDATE stylists SET pin_hash = NULL, failed_pin_attempts = 0, locked_until = NULL WHERE id != ?', [target.id]);
  }
  await query('UPDATE staff_sessions SET revoked_at = ? WHERE revoked_at IS NULL', [now]);
  const updated = await query(
    `UPDATE stylists SET role = 'owner', pin_hash = ?, pin_updated_at = CURRENT_TIMESTAMP,
            failed_pin_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_active = 1`,
    [pinHash, target.id]
  );
  if (updated.meta.changes !== 1) fail('スタッフの更新に失敗しました（対象が見つからないか、無効になっています）。');

  // 3. 確認
  const check = (await query<StaffRow>(
    'SELECT id, name, role, (pin_hash IS NOT NULL) AS has_pin FROM stylists WHERE id = ?', [target.id]
  )).results[0];
  if (check?.role !== 'owner' || !check.has_pin) fail('更新後の確認に失敗しました。');

  console.log(`\n完了しました。${check.name} を owner に設定し、PINを登録しました。`);
  console.log('管理画面で「スタッフを選択 → PIN入力」でログインできることを確認してください。');
}

main().catch((error: unknown) => {
  // エラーオブジェクトに PIN などが含まれないよう、メッセージだけ表示する
  fail(error instanceof Error ? error.message : '不明なエラー');
});
