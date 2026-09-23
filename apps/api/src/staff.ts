// スタッフ認証（スタッフ選択 + 6桁PIN）とスタッフ管理 API
import { WorkerEnv } from './types';
import { json } from './http';
import { burnPinVerification, hashPin, isValidPin, isWeakPin, verifyPin } from './auth/pin';
import { isManagerRole, isPermission, isRole, Role } from './auth/permissions';
import { createSession, revokeAllSessionsStatement, revokeSession, SESSION_APPS, SessionApp, StaffContext, staffContext } from './auth/session';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const LOGIN_FAILED_MESSAGE = 'スタッフまたはPINが正しくありません';

// ---- 公開用と管理用のスタッフ情報 ----
// SELECT * は使わない。pin_hash・失敗回数・ロック・セッションはどちらにも含めない。

// ログイン不要の API（Customer App・LINE・予約表）で返す列
export const PUBLIC_STYLIST_COLUMNS = 'id, name, bio, avatar_url';
// 予約を受けるスタッフの条件（LINE の指名候補・予約表・空き時間計算）
export const BOOKABLE_STYLIST_WHERE = 'is_active = 1 AND accepts_bookings = 1';

// ログイン必須の管理用 API で返す列
const ADMIN_STAFF_COLUMNS = `id, salon_id, name, email, phone, bio, avatar_url, role, accepts_bookings, is_active,
  (pin_hash IS NOT NULL) AS has_pin, locked_until, created_at, updated_at`;

interface StaffRow {
  id: string;
  salon_id: string;
  role: Role;
  is_active: number;
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

// 空文字は NULL として保存する（email の UNIQUE 制約で空欄同士が衝突しないように）
function optionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

async function getStaff(db: D1Database, id: string): Promise<StaffRow | null> {
  return db.prepare('SELECT id, salon_id, role, is_active FROM stylists WHERE id = ?').bind(id).first<StaffRow>();
}

async function countActiveOwners(db: D1Database): Promise<number> {
  const row = await db.prepare("SELECT COUNT(*) AS c FROM stylists WHERE role = 'owner' AND is_active = 1").first<{ c: number }>();
  return row?.c ?? 0;
}

// owner / admin に対する操作（無効化・役割変更・PIN再設定・他人のプロフィール編集）は owner だけ
function canAdministerTarget(actor: StaffContext, target: StaffRow): boolean {
  if (isManagerRole(target.role)) return actor.role === 'owner';
  return true;
}

function hasPermission(actor: StaffContext, permission: string): boolean {
  return (actor.permissions as string[]).includes(permission);
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && /UNIQUE constraint failed/i.test(error.message);
}

// ---- ログイン画面・認証 ----

export async function listLoginStaff(db: D1Database, cors: Record<string, string>): Promise<Response> {
  const { results } = await db.prepare(
    'SELECT id, name FROM stylists WHERE is_active = 1 AND pin_hash IS NOT NULL ORDER BY name'
  ).all<{ id: string; name: string }>();
  return json({ success: true, results: results || [] }, 200, cors);
}

export async function login(request: Request, env: WorkerEnv, db: D1Database, cors: Record<string, string>): Promise<Response> {
  const pepper = env.PIN_PEPPER;
  if (!pepper) {
    console.error('Staff login: PIN_PEPPER is not configured');
    return json({ error: 'Server misconfigured' }, 500, cors);
  }

  const body = await readJson(request);
  const stylistId = typeof body.stylist_id === 'string' ? body.stylist_id : '';
  const pin = body.pin;
  const app: SessionApp = (SESSION_APPS as readonly unknown[]).includes(body.app) ? (body.app as SessionApp) : 'salon';
  if (!stylistId || !isValidPin(pin)) {
    return json({ error: 'スタッフを選択し、6桁の数字のPINを入力してください' }, 400, cors);
  }

  const row = await db.prepare(
    'SELECT id, name, role, pin_hash, locked_until FROM stylists WHERE id = ? AND is_active = 1'
  ).bind(stylistId).first<{ id: string; name: string; role: Role; pin_hash: string | null; locked_until: number | null }>();

  if (!row || !row.pin_hash) {
    await burnPinVerification(pin, pepper);
    return json({ error: LOGIN_FAILED_MESSAGE }, 401, cors);
  }

  const now = Date.now();
  if (row.locked_until && row.locked_until > now) {
    return lockedResponse(row.locked_until, now, cors);
  }

  if (!(await verifyPin(pin, pepper, row.pin_hash))) {
    const failed = await recordFailedAttempt(db, row.id, now);
    if (failed.locked_until && failed.locked_until > now) {
      console.warn('Staff login: account locked after repeated failures', row.id);
      return lockedResponse(failed.locked_until, now, cors);
    }
    return json({ error: LOGIN_FAILED_MESSAGE }, 401, cors);
  }

  await db.prepare('UPDATE stylists SET failed_pin_attempts = 0, locked_until = NULL WHERE id = ?').bind(row.id).run();
  const session = await createSession(db, row.id, app);
  const staff = await staffContext(db, row, app, session.tokenHash);
  return json({ success: true, token: session.token, expires_at: session.expiresAt, ...meBody(staff) }, 200, cors);
}

// 失敗回数を加算し、5 回目でロックしてカウンタを 0 に戻す（1 文で加算するので同時アクセスでも数え漏れない）
async function recordFailedAttempt(db: D1Database, stylistId: string, now: number): Promise<{ locked_until: number | null }> {
  const row = await db.prepare(
    `UPDATE stylists
        SET locked_until = CASE WHEN failed_pin_attempts + 1 >= ? THEN ? ELSE locked_until END,
            failed_pin_attempts = CASE WHEN failed_pin_attempts + 1 >= ? THEN 0 ELSE failed_pin_attempts + 1 END
      WHERE id = ?
      RETURNING locked_until`
  ).bind(MAX_FAILED_ATTEMPTS, now + LOCK_MS, MAX_FAILED_ATTEMPTS, stylistId).first<{ locked_until: number | null }>();
  return { locked_until: row?.locked_until ?? null };
}

function lockedResponse(lockedUntil: number, now: number, cors: Record<string, string>): Response {
  const minutes = Math.ceil((lockedUntil - now) / 60000);
  return json({
    error: `PINを${MAX_FAILED_ATTEMPTS}回続けて間違えたため、ロックされています。約${minutes}分後にもう一度お試しください`,
    locked_until: lockedUntil,
  }, 429, cors);
}

function meBody(staff: StaffContext) {
  return {
    staff: { id: staff.id, name: staff.name, role: staff.role },
    permissions: staff.permissions,
    app: staff.app,
  };
}

export function me(staff: StaffContext, cors: Record<string, string>): Response {
  return json({ success: true, ...meBody(staff) }, 200, cors);
}

export async function logout(staff: StaffContext, db: D1Database, cors: Record<string, string>): Promise<Response> {
  await revokeSession(db, staff.tokenHash);
  return json({ success: true }, 200, cors);
}

// ---- スタッフ管理（ログイン必須） ----

export async function handleStaffRoutes(
  request: Request, env: WorkerEnv, db: D1Database, actor: StaffContext, cors: Record<string, string>
): Promise<Response | null> {
  const url = new URL(request.url);
  const m = url.pathname.match(/^\/api\/staff(?:\/([^/]+)(?:\/(role|permissions|pin))?)?$/);
  if (!m) return null;
  const [, id, sub] = m;
  const method = request.method;

  if (!id && method === 'GET') return listStaff(db, actor, cors);
  if (!id && method === 'POST') return createStaff(request, db, actor, cors);
  if (id && !sub && method === 'PUT') return updateStaff(request, db, actor, id, cors);
  if (id && !sub && method === 'DELETE') return deactivateStaff(db, actor, id, cors);
  if (id && sub === 'role' && method === 'PUT') return changeRole(request, db, actor, id, cors);
  if (id && sub === 'permissions' && method === 'PUT') return setPermissions(request, db, actor, id, cors);
  if (id && sub === 'pin' && method === 'PUT') return setPin(request, env, db, actor, id, cors);
  return null;
}

async function listStaff(db: D1Database, actor: StaffContext, cors: Record<string, string>): Promise<Response> {
  const { results } = await db.prepare(
    `SELECT ${ADMIN_STAFF_COLUMNS} FROM stylists ORDER BY is_active DESC, created_at`
  ).all<Record<string, unknown>>();
  const now = Date.now();
  // 権限の一覧は owner / admin だけが見られる（仕様書 §5）
  let permissionsById: Map<string, string[]> | null = null;
  if (isManagerRole(actor.role)) {
    const perms = await db.prepare('SELECT stylist_id, permission FROM staff_permissions').all<{ stylist_id: string; permission: string }>();
    permissionsById = new Map();
    for (const p of perms.results || []) {
      permissionsById.set(p.stylist_id, [...(permissionsById.get(p.stylist_id) || []), p.permission]);
    }
  }
  const staff = (results || []).map(({ locked_until, ...row }) => ({
    ...row,
    has_pin: Boolean(row.has_pin),
    is_locked: typeof locked_until === 'number' && locked_until > now,
    ...(permissionsById && { permissions: permissionsById.get(row.id as string) || [] }),
  }));
  return json({ success: true, results: staff, count: staff.length }, 200, cors);
}

async function createStaff(request: Request, db: D1Database, actor: StaffContext, cors: Record<string, string>): Promise<Response> {
  if (!hasPermission(actor, 'add_remove_staff')) return json({ error: 'スタッフを追加する権限がありません' }, 403, cors);
  const body = await readJson(request);
  const name = optionalText(body.name);
  if (!name) return json({ error: '名前を入力してください' }, 400, cors);
  const role: Role = body.role === undefined ? 'stylist' : (body.role as Role);
  if (!isRole(role)) return json({ error: '役割が正しくありません' }, 400, cors);
  if (isManagerRole(role) && actor.role !== 'owner') {
    return json({ error: 'owner / admin を追加できるのは owner だけです' }, 403, cors);
  }
  const acceptsBookings = typeof body.accepts_bookings === 'boolean' ? body.accepts_bookings : role === 'stylist';

  // サロンはリクエストではなく、ログイン中のスタッフの所属から決める
  const self = await getStaff(db, actor.id);
  const id = `stylist_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  try {
    await db.prepare(
      `INSERT INTO stylists (id, salon_id, name, email, phone, bio, avatar_url, role, accepts_bookings, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    ).bind(id, self!.salon_id, name, optionalText(body.email), optionalText(body.phone), optionalText(body.bio),
      optionalText(body.avatar_url), role, acceptsBookings ? 1 : 0).run();
  } catch (error) {
    if (isUniqueViolation(error)) return json({ error: 'このメールアドレスは他のスタッフが使っています' }, 409, cors);
    throw error;
  }
  return json({ success: true, id, message: 'Staff created' }, 201, cors);
}

async function updateStaff(request: Request, db: D1Database, actor: StaffContext, id: string, cors: Record<string, string>): Promise<Response> {
  const target = await getStaff(db, id);
  if (!target) return json({ error: 'スタッフが見つかりません' }, 404, cors);
  const body = await readJson(request);
  const isSelf = actor.id === id;
  const canManageStaff = hasPermission(actor, 'add_remove_staff') && canAdministerTarget(actor, target);

  // 本人はプロフィールだけ編集できる。予約受付・有効/無効は add_remove_staff が必要
  if (!isSelf && !canManageStaff) return json({ error: 'このスタッフを編集する権限がありません' }, 403, cors);
  if ((body.accepts_bookings !== undefined || body.is_active !== undefined) && !canManageStaff) {
    return json({ error: '予約受付・有効/無効を変更する権限がありません' }, 403, cors);
  }

  const updates: string[] = [];
  const bindings: unknown[] = [];
  if (body.name !== undefined) {
    const name = optionalText(body.name);
    if (!name) return json({ error: '名前を入力してください' }, 400, cors);
    updates.push('name = ?'); bindings.push(name);
  }
  for (const key of ['email', 'phone', 'bio', 'avatar_url'] as const) {
    if (body[key] !== undefined) { updates.push(`${key} = ?`); bindings.push(optionalText(body[key])); }
  }
  if (body.accepts_bookings !== undefined) { updates.push('accepts_bookings = ?'); bindings.push(body.accepts_bookings ? 1 : 0); }

  const deactivating = body.is_active !== undefined && !body.is_active && target.is_active === 1;
  if (body.is_active !== undefined) { updates.push('is_active = ?'); bindings.push(body.is_active ? 1 : 0); }
  if (deactivating && target.role === 'owner' && (await countActiveOwners(db)) <= 1) {
    return json({ error: '最後の owner は無効にできません' }, 409, cors);
  }
  if (updates.length === 0) return json({ error: '変更する項目がありません' }, 400, cors);

  updates.push('updated_at = CURRENT_TIMESTAMP');
  const statements = [db.prepare(`UPDATE stylists SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings, id)];
  if (deactivating) statements.push(revokeAllSessionsStatement(db, id));
  try {
    await db.batch(statements);
  } catch (error) {
    if (isUniqueViolation(error)) return json({ error: 'このメールアドレスは他のスタッフが使っています' }, 409, cors);
    throw error;
  }
  return json({ success: true, message: 'Staff updated' }, 200, cors);
}

// 削除は論理削除（is_active = 0）。予約・カルテなどの関連データは残す
async function deactivateStaff(db: D1Database, actor: StaffContext, id: string, cors: Record<string, string>): Promise<Response> {
  const target = await getStaff(db, id);
  if (!target) return json({ error: 'スタッフが見つかりません' }, 404, cors);
  if (!hasPermission(actor, 'add_remove_staff') || !canAdministerTarget(actor, target)) {
    return json({ error: 'このスタッフを削除する権限がありません' }, 403, cors);
  }
  if (target.role === 'owner' && target.is_active === 1 && (await countActiveOwners(db)) <= 1) {
    return json({ error: '最後の owner は削除できません' }, 409, cors);
  }
  await db.batch([
    db.prepare('UPDATE stylists SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(id),
    revokeAllSessionsStatement(db, id),
  ]);
  return json({ success: true, message: 'Staff deactivated' }, 200, cors);
}

async function changeRole(request: Request, db: D1Database, actor: StaffContext, id: string, cors: Record<string, string>): Promise<Response> {
  if (!isManagerRole(actor.role)) return json({ error: '役割を変更できるのは owner / admin だけです' }, 403, cors);
  const target = await getStaff(db, id);
  if (!target) return json({ error: 'スタッフが見つかりません' }, 404, cors);
  const body = await readJson(request);
  const role = body.role;
  if (!isRole(role)) return json({ error: '役割が正しくありません' }, 400, cors);
  if (role === target.role) return json({ success: true, message: 'Role unchanged' }, 200, cors);

  // admin の任命・変更、owner に関わる変更は owner だけ
  if ((isManagerRole(target.role) || isManagerRole(role)) && actor.role !== 'owner') {
    return json({ error: 'owner / admin の任命・変更は owner だけができます' }, 403, cors);
  }
  if (target.role === 'owner' && (await countActiveOwners(db)) <= 1) {
    return json({ error: '最後の owner は降格できません' }, 409, cors);
  }

  await db.batch([
    db.prepare('UPDATE stylists SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(role, id),
    revokeAllSessionsStatement(db, id, actor.id === id ? actor.tokenHash : undefined),
  ]);
  return json({ success: true, message: 'Role updated' }, 200, cors);
}

async function setPermissions(request: Request, db: D1Database, actor: StaffContext, id: string, cors: Record<string, string>): Promise<Response> {
  if (!isManagerRole(actor.role)) return json({ error: '権限を変更できるのは owner / admin だけです' }, 403, cors);
  const target = await getStaff(db, id);
  if (!target) return json({ error: 'スタッフが見つかりません' }, 404, cors);
  if (isManagerRole(target.role)) return json({ error: 'owner / admin は常に全権限を持つため、個別の権限は設定できません' }, 400, cors);

  const body = await readJson(request);
  const permissions = body.permissions;
  if (!Array.isArray(permissions) || !permissions.every(isPermission)) {
    return json({ error: '権限の指定が正しくありません' }, 400, cors);
  }
  const unique = [...new Set(permissions)];
  await db.batch([
    db.prepare('DELETE FROM staff_permissions WHERE stylist_id = ?').bind(id),
    ...unique.map((p) =>
      db.prepare('INSERT INTO staff_permissions (stylist_id, permission, granted_by) VALUES (?, ?, ?)').bind(id, p, actor.id)
    ),
  ]);
  return json({ success: true, permissions: unique }, 200, cors);
}

async function setPin(request: Request, env: WorkerEnv, db: D1Database, actor: StaffContext, id: string, cors: Record<string, string>): Promise<Response> {
  const pepper = env.PIN_PEPPER;
  if (!pepper) {
    console.error('Set PIN: PIN_PEPPER is not configured');
    return json({ error: 'Server misconfigured' }, 500, cors);
  }
  const target = await getStaff(db, id);
  if (!target || target.is_active !== 1) return json({ error: 'スタッフが見つかりません' }, 404, cors);

  const body = await readJson(request);
  const isSelf = actor.id === id;
  if (isSelf) {
    // 本人の変更は現在の PIN を確認する（失敗はログインと同じくロック対象）
    const row = await db.prepare('SELECT pin_hash, locked_until FROM stylists WHERE id = ?')
      .bind(id).first<{ pin_hash: string | null; locked_until: number | null }>();
    const now = Date.now();
    if (row?.locked_until && row.locked_until > now) return lockedResponse(row.locked_until, now, cors);
    if (row?.pin_hash && !(isValidPin(body.current_pin) && (await verifyPin(body.current_pin, pepper, row.pin_hash)))) {
      const failed = await recordFailedAttempt(db, id, now);
      if (failed.locked_until && failed.locked_until > now) return lockedResponse(failed.locked_until, now, cors);
      return json({ error: '現在のPINが正しくありません' }, 401, cors);
    }
  } else if (!isManagerRole(actor.role) || !canAdministerTarget(actor, target)) {
    return json({ error: 'このスタッフのPINを設定する権限がありません' }, 403, cors);
  }

  if (!isValidPin(body.pin)) return json({ error: 'PINは6桁の数字で入力してください' }, 400, cors);
  if (isWeakPin(body.pin)) return json({ error: '同じ数字の繰り返しや連番（123456 など）はPINに使えません' }, 400, cors);
  const pinHash = await hashPin(body.pin, pepper);
  await db.batch([
    db.prepare(
      `UPDATE stylists SET pin_hash = ?, pin_updated_at = CURRENT_TIMESTAMP, failed_pin_attempts = 0, locked_until = NULL,
              updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(pinHash, id),
    revokeAllSessionsStatement(db, id, isSelf ? actor.tokenHash : undefined),
  ]);
  return json({ success: true, message: 'PIN updated' }, 200, cors);
}
