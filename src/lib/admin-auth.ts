// Admin login: one shared admin account from environment variables.
//   ADMIN_EMAIL     login name (default: the NOTIFY_EMAIL address)
//   ADMIN_PASSWORD  the password (required; the panel stays locked without it)
//   ADMIN_SESSION_SECRET  optional extra secret for signing sessions
// A session is a signed, HttpOnly, Secure, SameSite=Strict cookie that expires in
// 12 hours. Nothing about the password is ever sent to the browser.
const env = (k: string): string => (process.env[k] ?? (import.meta.env as Record<string, string | undefined>)[k] ?? '').trim();

export const COOKIE = 'sarasvi_admin';
const TTL_MS = 12 * 60 * 60 * 1000;

export const adminConfigured = () => !!env('ADMIN_PASSWORD');
const adminEmail = () => (env('ADMIN_EMAIL') || env('NOTIFY_EMAIL').split(',')[0] || 'nmtsolutiontech@gmail.com').toLowerCase();
const secret = () => `${env('ADMIN_SESSION_SECRET')}|${env('ADMIN_PASSWORD')}|${env('SUPABASE_SERVICE_ROLE_KEY') || env('SUPABASE_SECRET_KEY')}`;

const enc = new TextEncoder();
async function hmac(msg: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time string compare. */
function same(a: string, b: string): boolean {
  const x = enc.encode(a), y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export async function checkLogin(email: string, password: string): Promise<boolean> {
  if (!adminConfigured()) return false;
  const okUser = same(email.trim().toLowerCase(), adminEmail());
  const okPass = same(password, env('ADMIN_PASSWORD'));
  return okUser && okPass;
}

export async function makeSession(): Promise<{ value: string; maxAge: number }> {
  const exp = Date.now() + TTL_MS;
  return { value: `${exp}.${await hmac(String(exp))}`, maxAge: TTL_MS / 1000 };
}

export async function isAdmin(request: Request): Promise<boolean> {
  if (!adminConfigured()) return false;
  const raw = (request.headers.get('cookie') ?? '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='));
  if (!raw) return false;
  const [exp, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return same(sig, await hmac(exp));
}

export const cookieHeader = (value: string, maxAge: number) =>
  `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;

// Failed-login throttle: 5 misses per IP per 15 min (per server instance; the
// strong password and the 700 ms delay on every attempt do the rest).
const misses = new Map<string, { n: number; until: number }>();
export function throttled(ip: string): boolean {
  const m = misses.get(ip);
  return !!m && m.n >= 5 && m.until > Date.now();
}
export function recordMiss(ip: string) {
  const m = misses.get(ip);
  if (!m || m.until < Date.now()) misses.set(ip, { n: 1, until: Date.now() + 15 * 60_000 });
  else m.n++;
}
export const clearMisses = (ip: string) => misses.delete(ip);
export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
