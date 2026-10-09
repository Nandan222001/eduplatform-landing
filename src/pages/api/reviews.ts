// GET /api/reviews: feedback that the customer allowed us to publish AND the admin
// approved, in the customer's own words. Shown in the testimonials section.
import type { APIRoute } from 'astro';
import { configured, json, select } from '../../lib/server';

export const prerender = false;

export const GET: APIRoute = async () => {
  if (!configured()) return json(200, { ok: true, reviews: [] });
  try {
    const { rows } = await select<{ name: string; role: string; institution: string; message: string }>('form_submissions', {
      select: 'name,role,institution,message', form_type: 'eq.feedback', publish_consent: 'eq.true', approved: 'eq.true', status: 'neq.spam', order: 'created_at.desc',
    }, [0, 11]);
    return new Response(JSON.stringify({ ok: true, reviews: rows }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
    });
  } catch (e) {
    console.error('[reviews]', e);
    return json(200, { ok: true, reviews: [] });
  }
};
