// API ごとのアクセス条件。ここに無いルートは「ログイン必須」として扱う（既定で拒否）。
// 個別の条件（本人か、owner か など）は各ハンドラで追加で検証する。
import { Permission } from './permissions';

export type Access =
  | { kind: 'public' }
  | { kind: 'login' }
  | { kind: 'permission'; permission: Permission };

const PUBLIC: Access = { kind: 'public' };
const SETTINGS: Access = { kind: 'permission', permission: 'change_settings' };

const ID = '[^/]+';
const RULES: Array<[method: string, path: RegExp, access: Access]> = [
  // ログイン不要（Customer App・LINE・ログイン画面）
  ['GET', /^\/api\/health$/, PUBLIC],
  ['GET', /^\/api\/stylists$/, PUBLIC],          // 公開用スタッフ情報のみ返す
  ['GET', /^\/api\/menus$/, PUBLIC],
  ['GET', /^\/api\/menu-sets$/, PUBLIC],
  ['GET', /^\/api\/availability$/, PUBLIC],
  ['GET', /^\/api\/salon\/settings$/, PUBLIC],   // 店名・住所など公開情報
  ['POST', /^\/api\/line\/webhook$/, PUBLIC],    // LINE 署名で検証する
  ['GET', /^\/api\/auth\/staff$/, PUBLIC],       // ログイン画面のスタッフ選択（id と名前のみ）
  ['POST', /^\/api\/auth\/login$/, PUBLIC],

  // change_settings: サロン情報・メニュー・営業時間・休日など店舗全体の設定
  ['POST', /^\/api\/menus$/, SETTINGS],
  ['PUT', new RegExp(`^/api/menus/${ID}$`), SETTINGS],
  ['DELETE', new RegExp(`^/api/menus/${ID}$`), SETTINGS],
  ['POST', /^\/api\/menu-sets$/, SETTINGS],
  ['PUT', new RegExp(`^/api/menu-sets/${ID}$`), SETTINGS],
  ['DELETE', new RegExp(`^/api/menu-sets/${ID}$`), SETTINGS],
  ['POST', /^\/api\/working-hours$/, SETTINGS],
  ['PUT', new RegExp(`^/api/working-hours/${ID}$`), SETTINGS],
  ['DELETE', new RegExp(`^/api/working-hours/${ID}$`), SETTINGS],
  ['POST', /^\/api\/off-days$/, SETTINGS],
  ['DELETE', new RegExp(`^/api/off-days/${ID}$`), SETTINGS],
  ['PUT', /^\/api\/salon\/settings$/, SETTINGS],
];

export function accessFor(method: string, pathname: string): Access {
  for (const [m, path, access] of RULES) {
    if (m === method && path.test(pathname)) return access;
  }
  return { kind: 'login' };
}
