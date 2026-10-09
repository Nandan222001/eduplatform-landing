// All admin API routes: /api/admin/<action>. Every route except login/session
// requires the signed admin cookie; every change also requires a same-origin POST.
import type { APIRoute } from 'astro';
import { adminConfigured, checkLogin, clearMisses, cookieHeader, delay, isAdmin, makeSession, recordMiss, throttled } from '../../../lib/admin-auth';
import { clientInfo, config, configured, json, remove, rpc, sameOrigin, select, str, update } from '../../../lib/server';

export const prerender = false;

const env = (k: string): string => (process.env[k] ?? (import.meta.env as Record<string, string | undefined>)[k] ?? '').trim();
const STATUSES = ['new', 'contacted', 'qualified', 'closed', 'spam'];
const TYPES = ['demo-request', 'newsletter', 'feedback'];
const UUID = /^[0-9a-f-]{36}$/i;
const COLS = 'id,created_at,form_type,name,email,phone,institution,role,students,message,privacy_consent,publish_consent,approved,page_url,referrer,utm,country,status,notes';

/** Build PostgREST filters from the admin's search box and dropdowns. */
function leadFilters(u: URL): Record<string, string> {
  const f: Record<string, string> = { select: COLS, order: 'created_at.desc' };
  const type = u.searchParams.get('type') ?? '';
  const status = u.searchParams.get('status') ?? '';
  const q = (u.searchParams.get('q') ?? '').replace(/[,()*%\\"']/g, ' ').trim().slice(0, 60);
  if (TYPES.includes(type)) f.form_type = `eq.${type}`;
  if (STATUSES.includes(status)) f.status = `eq.${status}`;
  else if (u.searchParams.get('hide_spam') !== '0' && status !== 'spam') f.status = 'neq.spam';
  if (q) f.or = `(name.ilike.*${q}*,email.ilike.*${q}*,institution.ilike.*${q}*,message.ilike.*${q}*)`;
  if (u.searchParams.get('pending') === '1') { f.publish_consent = 'eq.true'; f.approved = 'eq.false'; }
  return f;
}

const csv = (rows: Record<string, unknown>[]) => {
  const cols = ['created_at', 'form_type', 'status', 'name', 'email', 'phone', 'institution', 'role', 'students', 'message', 'publish_consent', 'approved', 'country', 'page_url', 'referrer', 'utm', 'notes'];
  const cell = (v: unknown) => {
    let s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // stop spreadsheet formula injection
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\r\n');
};

export const ALL: APIRoute = async ({ request, params, url, clientAddress }) => {
  const action = (params.path ?? '').replace(/\/$/, '');
  const method = request.method;
  const { ip } = clientInfo(request, clientAddress);

  // ---- public to the login page ------------------------------------------------
  if (action === 'login' && method === 'POST') {
    if (!sameOrigin(request) || !request.headers.get('origin')) return json(403, { ok: false });
    if (!adminConfigured()) return json(503, { ok: false, error: 'not_configured' });
    if (throttled(ip)) return json(429, { ok: false, error: 'too_many_attempts' });
    let d: Record<string, unknown> = {};
    try { d = await request.json(); } catch { /* empty */ }
    await delay(700);
    if (!(await checkLogin(String(d.email ?? ''), String(d.password ?? '')))) { recordMiss(ip); return json(401, { ok: false, error: 'wrong_credentials' }); }
    clearMisses(ip);
    const s = await makeSession();
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Set-Cookie': cookieHeader(s.value, s.maxAge) } });
  }
  if (action === 'logout' && method === 'POST') {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookieHeader('', 0) } });
  }
  if (action === 'session' && method === 'GET') {
    return json(200, { ok: true, authenticated: await isAdmin(request), configured: adminConfigured() });
  }

  // ---- everything below needs the admin cookie -----------------------------------
  if (!(await isAdmin(request))) return json(401, { ok: false, error: 'unauthorised' });
  if (!configured()) return json(503, { ok: false, error: 'supabase_not_configured' });
  if (method !== 'GET' && (!sameOrigin(request) || !request.headers.get('origin'))) return json(403, { ok: false });

  try {
    if (action === 'stats' && method === 'GET') {
      const days = Math.max(1, Math.min(365, Number(url.searchParams.get('days')) || 30));
      return json(200, { ok: true, stats: await rpc('admin_stats', { p_days: days }) });
    }

    if (action === 'leads' && method === 'GET') {
      const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
      const size = Math.max(5, Math.min(100, Number(url.searchParams.get('size')) || 25));
      const { rows, total } = await select('form_submissions', leadFilters(url), [(page - 1) * size, page * size - 1]);
      return json(200, { ok: true, rows, total, page, size });
    }

    if (action === 'export' && method === 'GET') {
      const { rows } = await select('form_submissions', leadFilters(url), [0, 4999]);
      return new Response('﻿' + csv(rows as Record<string, unknown>[]), {
        status: 200,
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="sarasvi-leads-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' },
      });
    }

    if (action === 'events' && method === 'GET') {
      const f: Record<string, string> = { select: 'id,created_at,event,path,device,country,utm_source,referrer,props', order: 'created_at.desc' };
      const ev = url.searchParams.get('event') ?? '';
      if (/^[a-z_]{2,40}$/.test(ev)) f.event = `eq.${ev}`;
      const { rows, total } = await select('analytics_events', f, [0, 99]);
      return json(200, { ok: true, rows, total });
    }

    if (action === 'lead' && method === 'PATCH') {
      const d = (await request.json()) as Record<string, unknown>;
      const id = String(d.id ?? '');
      if (!UUID.test(id)) return json(400, { ok: false, error: 'bad_id' });
      const patch: Record<string, unknown> = {};
      if (typeof d.status === 'string') { if (!STATUSES.includes(d.status)) return json(400, { ok: false, error: 'bad_status' }); patch.status = d.status; }
      if ('notes' in d) patch.notes = str(d.notes, 2000);
      if (typeof d.approved === 'boolean') {
        if (d.approved) {
          // Only feedback whose author allowed publishing can go on the website.
          const { rows } = await select<{ form_type: string; publish_consent: boolean }>('form_submissions', { select: 'form_type,publish_consent', id: `eq.${id}` });
          if (!rows[0] || rows[0].form_type !== 'feedback' || !rows[0].publish_consent) return json(409, { ok: false, error: 'no_publish_permission' });
        }
        patch.approved = d.approved;
      }
      if (!Object.keys(patch).length) return json(400, { ok: false, error: 'nothing_to_update' });
      await update('form_submissions', { id: `eq.${id}` }, patch);
      return json(200, { ok: true });
    }

    if (action === 'lead' && method === 'DELETE') {
      const id = url.searchParams.get('id') ?? '';
      if (!UUID.test(id)) return json(400, { ok: false, error: 'bad_id' });
      await remove('form_submissions', { id: `eq.${id}` });
      return json(200, { ok: true });
    }

    if (action === 'health' && method === 'GET') {
      const t0 = Date.now();
      const c = await select('form_submissions', { select: 'id' }, [0, 0]);
      const e = await select('analytics_events', { select: 'id' }, [0, 0]);
      return json(200, { ok: true, health: {
        database: { ok: true, ms: Date.now() - t0, submissions: c.total, events: e.total, host: config().url.replace(/^https?:\/\//, '') },
        email_alerts: { configured: !!env('RESEND_API_KEY'), to: (env('NOTIFY_EMAIL') || 'nmtsolutiontech@gmail.com') },
        google_analytics: { configured: !!env('PUBLIC_GA_ID'), id: env('PUBLIC_GA_ID') || null },
        site_url: env('SITE_URL') || env('VERCEL_PROJECT_PRODUCTION_URL') || null,
      } });
    }

    return json(404, { ok: false, error: 'not_found' });
  } catch (e) {
    console.error('[admin]', action, e);
    return json(502, { ok: false, error: 'backend_error' });
  }
};
