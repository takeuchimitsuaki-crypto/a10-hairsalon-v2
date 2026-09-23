// CORS とJSONレスポンスの共通処理

// 本番・プレビュー・ローカル開発のアプリだけにブラウザからの呼び出しを許可する。
// LINE など Origin を付けないサーバー間通信には影響しない。
const ALLOWED_ORIGINS = new Set([
  'https://a10-hairsalon.vercel.app',
  'https://a10-stylist.vercel.app',
  'https://a10-hairsalon-v2-customer.vercel.app',
]);
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/[a-z0-9-]+-a10-hairsalon-app\.vercel\.app$/, // Vercel チーム配下のデプロイ
  /^https:\/\/(admin|stylist|app)\.goodhairdesign\.com$/,  // 予定している独自ドメイン
  /^http:\/\/(localhost|127\.0\.0\.1):\d+$/,               // ローカル開発
];

export function corsHeadersFor(request: Request): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '600',
    'Vary': 'Origin',
  };
  const origin = request.headers.get('Origin');
  if (origin && (ALLOWED_ORIGINS.has(origin) || ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin)))) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

export function json(data: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
