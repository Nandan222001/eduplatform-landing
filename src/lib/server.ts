// Server-only helpers for /api/submit and /api/track. Never imported by browser code.
// Talks to Supabase through its REST API (PostgREST) with the service-role key,
// which lives only in Vercel's environment variables.

const env = (k: string): string => (process.env[k] ?? (import.meta.env as Record<string, string | undefined>)[k] ?? '').trim();

// Names set by the Supabase <-> Vercel integration are accepted as fallbacks, and
// both key formats work: the legacy service_role JWT and the newer sb_secret_ key.
const first = (...keys: string[]) => keys.map(env).find(Boolean) ?? '';
export const config = () => ({
  url: first('SUPABASE_URL', 'PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL').replace(/\/$/, ''),
  key: first('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY'),
  salt: env('IP_HASH_SALT') || env('SUPABASE_JWT_SECRET') || 'sarasvi',
});
export const configured = () => { const c = config(); return !!(c.url && c.key); };

function headers(extra: Record<string, string> = {}) {
  const { key } = config();
  // sb_secret_ keys go in `apikey` only; a legacy JWT key is also sent as the bearer token.
  const auth: Record<string, string> = key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {};
  return { apikey: key, ...auth, 'Content-Type': 'application/json', ...extra };
}

/** Insert one row. Throws on a non-2xx answer so the caller can return 502. */
export async function insert(table: string, row: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${config().url}/rest/v1/${table}`, {
    method: 'POST',
    headers: headers({ Prefer: 'return=minimal' }),
    body: JSON.stringify(row),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`supabase insert ${table}: ${res.status} ${await res.text().catch(() => '')}`);
}

/** Count rows matching PostgREST filters, e.g. { ip_hash: 'eq.abc', created_at: 'gte.2026-…' }. */
export async function count(table: string, filters: Record<string, string>): Promise<number> {
  const qs = new URLSearchParams({ select: 'id', ...filters });
  const res = await fetch(`${config().url}/rest/v1/${table}?${qs}`, {
    method: 'HEAD',
    headers: headers({ Prefer: 'count=exact' }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`supabase count ${table}: ${res.status}`);
  const range = res.headers.get('content-range') ?? '*/0';
  return Number(range.split('/')[1]) || 0;
}

export async function ipHash(ip: string): Promise<string> {
  const data = new TextEncoder().encode(config().salt + '|' + ip);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

export function clientInfo(request: Request, clientAddress?: string) {
  const h = request.headers;
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || clientAddress || '0.0.0.0';
  const country = (h.get('x-vercel-ip-country') ?? '').slice(0, 2).toUpperCase() || null;
  return { ip, country, userAgent: (h.get('user-agent') ?? '').slice(0, 400) };
}

/** Same-site check: browsers always send Origin on POST; reject other sites posting to us. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // non-browser clients (curl, sendBeacon in some browsers) — still validated
  try { return new URL(origin).host === new URL(request.url).host || new URL(origin).host === request.headers.get('host'); }
  catch { return false; }
}

export const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const str = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const s = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  return s ? s.slice(0, max) : null;
};
