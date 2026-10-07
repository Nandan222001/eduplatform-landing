// POST /api/submit — every form on the site (demo request, newsletter, feedback).
// Server-side: same-origin check, honeypot, time trap, validation, per-IP rate
// limit, duplicate guard, then one row into Supabase `form_submissions`.
import type { APIRoute } from 'astro';
import { clientInfo, configured, count, insert, ipHash, json, sameOrigin, str } from '../../lib/server';
import { notifyTeam } from '../../lib/notify';

export const prerender = false;

const FORMS = ['demo-request', 'newsletter', 'feedback'] as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[0-9+\-\s()]{7,18}$/;
const LIMIT = 5;            // submissions per IP …
const WINDOW_MIN = 10;      // … per 10 minutes

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!sameOrigin(request)) return json(403, { ok: false, error: 'forbidden' });
  if (!configured()) return json(503, { ok: false, error: 'not_configured' });
  if (Number(request.headers.get('content-length') ?? 0) > 10_000) return json(413, { ok: false, error: 'too_large' });

  let d: Record<string, unknown>;
  try { d = await request.json(); } catch { return json(400, { ok: false, error: 'bad_json' }); }

  // Bots: filled the hidden field, or submitted faster than a person can type.
  // Answer 200 so they learn nothing, store nothing.
  if (str(d.website, 200)) return json(200, { ok: true });
  const elapsed = Number(d.elapsedMs);
  if (Number.isFinite(elapsed) && elapsed < 2500) return json(200, { ok: true });

  const form = str(d.form, 30) as (typeof FORMS)[number] | null;
  const errors: Record<string, string> = {};
  if (!form || !FORMS.includes(form)) return json(400, { ok: false, error: 'unknown_form' });

  const email = str(d.email, 200)?.toLowerCase() ?? '';
  if (!EMAIL.test(email)) errors.email = 'Please enter a valid email address.';
  const name = str(d.name, 100);
  const institution = str(d.institution, 150);
  const phone = str(d.phone, 30);
  const message = str(d.message, 1000);
  const consent = d.consent === true || d.consent === 'on' || d.consent === 'yes';

  if (form !== 'newsletter') {
    if (!name || name.length < 2) errors.name = 'Please enter your name.';
    if (!institution) errors.institution = 'Please enter your institution.';
    if (!consent) errors.consent = 'Please accept to continue.';
  }
  if (phone && !PHONE.test(phone)) errors.phone = 'Enter a valid phone number.';
  if (form === 'feedback' && (!message || message.length < 10)) errors.message = 'Please write a few words (at least 10 characters).';
  if (Object.keys(errors).length) return json(422, { ok: false, error: 'invalid', fields: errors });

  const { ip, country, userAgent } = clientInfo(request, clientAddress);
  const hash = await ipHash(ip);
  const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();

  try {
    if ((await count('form_submissions', { ip_hash: `eq.${hash}`, created_at: `gte.${since}` })) >= LIMIT)
      return json(429, { ok: false, error: 'rate_limited' });
    // Same person, same form, within 2 minutes: a double click, not a new lead.
    const recent = new Date(Date.now() - 2 * 60_000).toISOString();
    if ((await count('form_submissions', { form_type: `eq.${form}`, email: `eq.${email}`, created_at: `gte.${recent}` })) > 0)
      return json(200, { ok: true, duplicate: true });

    const utm = (typeof d.utm === 'object' && d.utm) ? d.utm as Record<string, unknown> : {};
    const row = {
      form_type: form,
      name, email, phone, institution,
      role: str(d.role, 60),
      students: str(d.students, 40),
      message,
      privacy_consent: form === 'newsletter' ? true : consent,
      publish_consent: form === 'feedback' && (d.publish === 'yes' || d.publish === true),
      page_url: str(d.page, 500),
      referrer: str(d.referrer, 500),
      utm: Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
        .map((k) => [k, str(utm[k], 100)]).filter(([, v]) => v)),
      country, user_agent: userAgent, ip_hash: hash,
    };
    await insert('form_submissions', row);
    // Awaited (not fire-and-forget): a serverless function may be frozen as soon
    // as it responds. notifyTeam never throws and times out after 6 s.
    await notifyTeam(form, row);
    return json(200, { ok: true });
  } catch (e) {
    console.error('[submit]', e);
    return json(502, { ok: false, error: 'storage_failed' });
  }
};

export const ALL: APIRoute = () => json(405, { ok: false, error: 'method_not_allowed' });
