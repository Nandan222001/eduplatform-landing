// Email the team about every new form submission, via Resend (https://resend.com).
// Needs RESEND_API_KEY. Sends to NOTIFY_EMAIL (default nmtsolutiontech@gmail.com),
// with Reply-To set to the visitor so answering is one click.
// Without a verified sending domain, Resend only delivers to the address that owns
// the Resend account, so sign up to Resend with the NOTIFY_EMAIL address.
// A failed email never fails the submission: the row is already in Supabase.

const env = (k: string): string => (process.env[k] ?? (import.meta.env as Record<string, string | undefined>)[k] ?? '').trim();

const TITLES: Record<string, string> = {
  'demo-request': 'New demo request',
  feedback: 'New customer feedback',
  newsletter: 'New newsletter subscriber',
};

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export async function notifyTeam(form: string, row: Record<string, unknown>): Promise<void> {
  const key = env('RESEND_API_KEY');
  if (!key) return;
  const to = (env('NOTIFY_EMAIL') || 'nmtsolutiontech@gmail.com').split(',').map((s) => s.trim()).filter(Boolean);
  const from = env('NOTIFY_FROM') || 'Sarasvi Website <onboarding@resend.dev>';
  const title = TITLES[form] ?? 'New website form';
  const who = [row.name, row.institution].filter(Boolean).join(' – ') || String(row.email);

  const fields: [string, unknown][] = [
    ['Name', row.name], ['Email', row.email], ['Phone / WhatsApp', row.phone],
    ['Institution', row.institution], ['Role', row.role], ['Students', row.students],
    ['Message', row.message],
    ['May publish on website', form === 'feedback' ? (row.publish_consent ? 'Yes' : 'No') : null],
    ['Sent from page', row.page_url], ['Came from', row.referrer],
    ['Campaign', Object.entries((row.utm as Record<string, string>) ?? {}).map(([k, v]) => `${k}=${v}`).join(', ')],
    ['Country', row.country],
  ];
  const rows = fields.filter(([, v]) => v !== null && v !== undefined && v !== '');
  const html = `<div style="font-family:Arial,sans-serif;color:#3B2314;max-width:600px">
<h2 style="color:#BF5000;margin:0 0 4px">${esc(title)}</h2>
<p style="margin:0 0 16px;color:#6B4A33">${esc(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }))} IST</p>
<table cellpadding="8" style="border-collapse:collapse;width:100%;font-size:14px">
${rows.map(([k, v]) => `<tr><td style="border-bottom:1px solid #EDDFCC;color:#6B4A33;width:38%;vertical-align:top">${esc(k)}</td><td style="border-bottom:1px solid #EDDFCC;white-space:pre-wrap">${esc(v)}</td></tr>`).join('\n')}
</table>
<p style="margin-top:18px;font-size:13px;color:#6B4A33">Press <b>Reply</b> to answer ${esc(row.name || row.email)} directly. All submissions are also saved in Supabase → Table Editor → form_submissions.</p>
</div>`;
  const text = `${title}\n\n` + rows.map(([k, v]) => `${k}: ${v}`).join('\n');

  try {
    const res = await fetch(`${env('RESEND_API_URL') || 'https://api.resend.com'}/emails`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, reply_to: String(row.email), subject: `${title}: ${who}`.slice(0, 150), html, text }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) console.error('[notify] resend', res.status, await res.text().catch(() => ''));
  } catch (e) {
    console.error('[notify]', e);
  }
}
