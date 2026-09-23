// PIN のハッシュ化と検証。
// Worker と初期設定スクリプト（scripts/setup-owner.ts, Node で実行）の両方から使うため、
// WebCrypto と標準 API だけに依存させる（Workers 固有の型・Node 固有の API は使わない）。
//
// 形式: pbkdf2-sha256$<iterations>$<salt(base64)>$<hash(base64)>
// PIN は 6 桁しかなく総当たりに弱いため、PBKDF2 の前に Workers Secret の PIN_PEPPER で
// HMAC をかける。DB だけが漏れても、PEPPER が無ければオフラインで総当たりできない。

export const PIN_PATTERN = /^\d{6}$/;

// Workers の PBKDF2 は 100,000 回が上限。無料プランの CPU 時間（10ms）にも収まる値にする。
// 回数はハッシュ文字列に含めるので、後から上げても既存の PIN はそのまま検証できる。
export const PBKDF2_ITERATIONS = 50_000;

const SCHEME = 'pbkdf2-sha256';
const encoder = new TextEncoder();

export function isValidPin(pin: unknown): pin is string {
  return typeof pin === 'string' && PIN_PATTERN.test(pin);
}

// 同じ数字の繰り返し（000000）や連番（123456 / 654321）は推測されやすいので使わせない
export function isWeakPin(pin: string): boolean {
  if (/^(\d)\1{5}$/.test(pin)) return true;
  return '0123456789012'.includes(pin) || '9876543210987'.includes(pin);
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

async function derive(pin: string, pepper: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<Uint8Array> {
  const hmacKey = await crypto.subtle.importKey('raw', encoder.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const peppered = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(pin));
  const pbkdf2Key = await crypto.subtle.importKey('raw', peppered, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, pbkdf2Key, 256);
  return new Uint8Array(bits);
}

// 長さが同じなら内容によらず同じ時間で比較する
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashPin(pin: string, pepper: string): Promise<string> {
  if (!isValidPin(pin)) throw new Error('PIN must be exactly 6 digits');
  if (!pepper) throw new Error('PIN_PEPPER is not configured');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(pin, pepper, salt, PBKDF2_ITERATIONS);
  return `${SCHEME}$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPin(pin: string, pepper: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== SCHEME) return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > 100_000) return false;
  let salt: Uint8Array<ArrayBuffer>;
  let expected: Uint8Array;
  try {
    salt = fromBase64(parts[2]);
    expected = fromBase64(parts[3]);
  } catch {
    return false;
  }
  const actual = await derive(pin, pepper, salt, iterations);
  return constantTimeEqual(actual, expected);
}

// 存在しないスタッフでのログイン試行でも同じだけ時間をかけ、応答時間から存在を推測されないようにする
export async function burnPinVerification(pin: string, pepper: string): Promise<void> {
  await derive(pin, pepper, new Uint8Array(16), PBKDF2_ITERATIONS);
}
