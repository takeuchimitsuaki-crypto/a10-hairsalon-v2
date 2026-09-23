import { createStaffAuthClient } from '../../../../packages/shared/src/auth/staffAuth';
import { API_BASE_URL } from '../config';

export const staffAuth = createStaffAuthClient({ baseUrl: API_BASE_URL, app: 'salon' });

// すべての API 呼び出しはこれを使う（ログイン中のトークンを付け、401 ならログイン画面に戻す）
export const apiFetch = staffAuth.apiFetch;
