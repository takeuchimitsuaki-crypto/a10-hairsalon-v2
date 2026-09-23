// ログインセッション。トークン本体はクライアントだけが持ち、DB には SHA-256 ハッシュを保存する。
import { effectivePermissions, Permission, Role } from './permissions';

export const SESSION_IDLE_MS = 12 * 60 * 60 * 1000; // 最後の操作から 12 時間
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;             // 有効期限の延長は最大 5 分に 1 回だけ書き込む
const EXPIRED_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export const SESSION_APPS = ['salon', 'stylist'] as const;
export type SessionApp = (typeof SESSION_APPS)[number];

export interface StaffContext {
  id: string;
  name: string;
  role: Role;
  permissions: Permission[];
  app: SessionApp;
  tokenHash: string;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createSession(db: D1Database, stylistId: string, app: SessionApp): Promise<{ token: string; tokenHash: string; expiresAt: number }> {
  const token = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256Hex(token);
  const now = Date.now();
  const expiresAt = now + SESSION_IDLE_MS;
  await db.batch([
    db.prepare('DELETE FROM staff_sessions WHERE expires_at < ?').bind(now - EXPIRED_RETENTION_MS),
    db.prepare(
      `INSERT INTO staff_sessions (token_hash, stylist_id, app, created_at, expires_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(tokenHash, stylistId, app, now, expiresAt, now),
  ]);
  return { token, tokenHash, expiresAt };
}

// Authorization: Bearer <token> を検証し、ログイン中のスタッフと実際に使える権限を返す。
// 権限は毎回 DB から読むので、権限の変更はすぐに反映される。
export async function authenticate(request: Request, db: D1Database): Promise<StaffContext | null> {
  const header = request.headers.get('Authorization') || '';
  const match = header.match(/^Bearer ([A-Za-z0-9_-]{20,128})$/);
  if (!match) return null;

  const tokenHash = await sha256Hex(match[1]);
  const now = Date.now();
  const row = await db.prepare(
    `SELECT s.id, s.name, s.role, ss.app, ss.last_seen_at
       FROM staff_sessions ss
       JOIN stylists s ON s.id = ss.stylist_id
      WHERE ss.token_hash = ? AND ss.revoked_at IS NULL AND ss.expires_at > ?
        AND s.is_active = 1 AND s.pin_hash IS NOT NULL`
  ).bind(tokenHash, now).first<{ id: string; name: string; role: Role; app: SessionApp; last_seen_at: number }>();
  if (!row) return null;

  if (now - row.last_seen_at > TOUCH_INTERVAL_MS) {
    await db.prepare('UPDATE staff_sessions SET last_seen_at = ?, expires_at = ? WHERE token_hash = ?')
      .bind(now, now + SESSION_IDLE_MS, tokenHash).run();
  }

  return staffContext(db, row, row.app, tokenHash);
}

export async function staffContext(
  db: D1Database, staff: { id: string; name: string; role: Role }, app: SessionApp, tokenHash: string
): Promise<StaffContext> {
  const { results } = await db.prepare('SELECT permission FROM staff_permissions WHERE stylist_id = ?')
    .bind(staff.id).all<{ permission: string }>();
  return {
    id: staff.id,
    name: staff.name,
    role: staff.role,
    permissions: effectivePermissions(staff.role, (results || []).map((r) => r.permission)),
    app,
    tokenHash,
  };
}

export async function revokeSession(db: D1Database, tokenHash: string): Promise<void> {
  await db.prepare('UPDATE staff_sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL')
    .bind(Date.now(), tokenHash).run();
}

// PIN 変更・無効化・役割変更のときに、そのスタッフのセッションをすべて無効にする
export function revokeAllSessionsStatement(db: D1Database, stylistId: string, exceptTokenHash?: string): D1PreparedStatement {
  return db.prepare(
    'UPDATE staff_sessions SET revoked_at = ? WHERE stylist_id = ? AND revoked_at IS NULL AND token_hash != ?'
  ).bind(Date.now(), stylistId, exceptTokenHash || '');
}
