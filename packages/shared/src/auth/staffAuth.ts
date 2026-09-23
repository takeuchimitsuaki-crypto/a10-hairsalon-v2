// スタッフ認証（スタッフ選択 + 6桁PIN）のクライアント。Salon App と Stylist App で共通に使う。
// React には依存させない。セッショントークンは sessionStorage に置くので、タブを閉じると再ログインになる。

export type StaffRole = 'owner' | 'admin' | 'staff' | 'stylist';
export type StaffPermission = 'add_remove_staff' | 'change_settings' | 'edit_records' | 'delete_customers' | 'export_csv';
export type StaffApp = 'salon' | 'stylist';

export const ROLE_LABELS: Record<StaffRole, string> = {
  owner: 'オーナー',
  admin: '管理者',
  staff: 'スタッフ（受付・アシスタント）',
  stylist: 'スタイリスト',
};

export const PERMISSION_LABELS: Record<StaffPermission, string> = {
  add_remove_staff: 'スタッフの追加・削除',
  change_settings: 'サロン設定の変更（サロン情報・メニュー・営業時間・休日・予約ルール）',
  edit_records: 'カルテの編集',
  delete_customers: '顧客の削除',
  export_csv: 'CSV エクスポート',
};

export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as StaffPermission[];

export function isManagerRole(role: StaffRole): boolean {
  return role === 'owner' || role === 'admin';
}

export interface StaffSession {
  staff: { id: string; name: string; role: StaffRole };
  permissions: StaffPermission[];
  app: StaffApp;
}

export class StaffAuthError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export function createStaffAuthClient(options: { baseUrl: string; app: StaffApp }) {
  const storageKey = `a10.staffSession.${options.app}`;
  const unauthorizedListeners = new Set<() => void>();

  const getToken = (): string | null => {
    try { return sessionStorage.getItem(storageKey); } catch { return null; }
  };
  const setToken = (token: string | null) => {
    try {
      if (token) sessionStorage.setItem(storageKey, token);
      else sessionStorage.removeItem(storageKey);
    } catch { /* sessionStorage が使えない環境ではメモリ上の state だけで動く */ }
  };

  // API 呼び出し。ログイン中ならトークンを付け、401 ならログイン画面に戻す
  async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const res = await fetch(`${options.baseUrl}${path}`, { ...init, headers });
    if (res.status === 401 && token) {
      setToken(null);
      unauthorizedListeners.forEach((listener) => listener());
    }
    return res;
  }

  async function readError(res: Response): Promise<string> {
    const data = await res.json().catch(() => ({}));
    return (data as { error?: string }).error || `エラーが発生しました（${res.status}）`;
  }

  return {
    apiFetch,
    hasToken: () => getToken() !== null,

    onUnauthorized(listener: () => void): () => void {
      unauthorizedListeners.add(listener);
      return () => { unauthorizedListeners.delete(listener); };
    },

    async listLoginStaff(): Promise<Array<{ id: string; name: string }>> {
      const res = await fetch(`${options.baseUrl}/api/auth/staff`);
      if (!res.ok) throw new StaffAuthError(await readError(res), res.status);
      return ((await res.json()) as { results: Array<{ id: string; name: string }> }).results;
    },

    async login(stylistId: string, pin: string): Promise<StaffSession> {
      const res = await fetch(`${options.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stylist_id: stylistId, pin, app: options.app }),
      });
      if (!res.ok) throw new StaffAuthError(await readError(res), res.status);
      const data = (await res.json()) as StaffSession & { token: string };
      setToken(data.token);
      return { staff: data.staff, permissions: data.permissions, app: data.app };
    },

    // 保存済みのトークンでログイン中のスタッフを取得する（無効なら null）
    async me(): Promise<StaffSession | null> {
      if (!getToken()) return null;
      const res = await apiFetch('/api/auth/me');
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new StaffAuthError(await readError(res), res.status);
      }
      const data = (await res.json()) as StaffSession;
      return { staff: data.staff, permissions: data.permissions, app: data.app };
    },

    async logout(): Promise<void> {
      if (getToken()) await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
      setToken(null);
    },

    readError,
  };
}

export type StaffAuthClient = ReturnType<typeof createStaffAuthClient>;
