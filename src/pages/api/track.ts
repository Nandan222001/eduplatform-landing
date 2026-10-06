// POST /api/track — first-party, cookieless analytics into Supabase `analytics_events`.
// The browser only calls this after consent where consent is required (see Analytics.astro).
import type { APIRoute } from 'astro';
import { clientInfo, configured, insert, json, sameOrigin, str } from '../../lib/server';

export const prerender = false;

const EVENTS = new Set(['page_view', 'cta_click', 'form_submit', 'scroll_depth', 'faq_open', 'video_play', 'outbound_click']);
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp/i;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!sameOrigin(request)) return json(403, { ok: false });
  if (!configured()) return new Response(null, { status: 204 });
  const raw = await request.text();
  if (raw.length > 4000) return json(413, { ok: false });
  let d: Record<string, unknown>;
  try { d = JSON.parse(raw); } catch { return json(400, { ok: false }); }

  const event = str(d.event, 40);
  if (!event || !EVENTS.has(event)) return json(400, { ok: false });
  const { country, userAgent } = clientInfo(request, clientAddress);
  if (BOT.test(userAgent)) return new Response(null, { status: 204 });

  const props: Record<string, string | number> = {};
  if (d.props && typeof d.props === 'object') {
    for (const [k, v] of Object.entries(d.props as Record<string, unknown>).slice(0, 8)) {
      if (!/^[a-z_]{1,30}$/.test(k)) continue;
      if (typeof v === 'number' && Number.isFinite(v)) props[k] = v;
      else { const s = str(v, 120); if (s) props[k] = s; }
    }
  }
  const w = Number(d.screenW);
  const device = !Number.isFinite(w) ? null : w < 768 ? 'mobile' : w < 1100 ? 'tablet' : 'desktop';
  try {
    await insert('analytics_events', {
      event,
      path: str(d.path, 300) ?? '/',
      referrer: str(d.referrer, 300),
      utm_source: str(d.utm_source, 100), utm_medium: str(d.utm_medium, 100), utm_campaign: str(d.utm_campaign, 100),
      session_id: str(d.sid, 40),
      device, screen_w: Number.isFinite(w) ? Math.max(0, Math.min(10000, Math.round(w))) : null,
      lang: str(d.lang, 20), country, props,
    });
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error('[track]', e);
    return json(502, { ok: false });
  }
};
