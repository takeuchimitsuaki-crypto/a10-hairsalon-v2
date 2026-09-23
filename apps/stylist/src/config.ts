// API の接続先。VITE_API_BASE_URL で切り替える（末尾の / は不要）。
// ローカル開発で未設定の場合は wrangler dev の http://localhost:8787 を使う。
const envBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE_URL = (envBaseUrl || (import.meta.env.DEV ? 'http://localhost:8787' : '')).replace(/\/+$/, '');

if (!API_BASE_URL) {
  console.error('VITE_API_BASE_URL が設定されていません。API に接続できません。');
}
