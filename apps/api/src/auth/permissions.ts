// 役割と権限の定義（仕様書 §5）

export const ROLES = ['owner', 'admin', 'staff', 'stylist'] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  'add_remove_staff', // スタッフの追加・削除（無効化）
  'change_settings',  // サロン情報・メニュー・営業時間・休日・予約ルールなど店舗全体の設定
  'edit_records',     // カルテの編集
  'delete_customers', // 顧客の削除
  'export_csv',       // CSV エクスポート
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export function isPermission(value: unknown): value is Permission {
  return typeof value === 'string' && (PERMISSIONS as readonly string[]).includes(value);
}

// owner / admin は staff_permissions に関係なく常に全権限
export function isManagerRole(role: string): boolean {
  return role === 'owner' || role === 'admin';
}

export function effectivePermissions(role: string, granted: string[]): Permission[] {
  if (isManagerRole(role)) return [...PERMISSIONS];
  return PERMISSIONS.filter((p) => granted.includes(p));
}
