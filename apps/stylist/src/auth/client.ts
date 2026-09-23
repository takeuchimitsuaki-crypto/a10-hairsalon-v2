import { createStaffAuthClient } from '../../../../packages/shared/src/auth/staffAuth';
import { API_BASE_URL } from '../config';

// Salon App と同じスタッフ認証を使う（セッションはアプリごとに別。app = 'stylist'）
export const staffAuth = createStaffAuthClient({ baseUrl: API_BASE_URL, app: 'stylist' });

export const apiFetch = staffAuth.apiFetch;
