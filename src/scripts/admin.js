// Sarasvi admin panel (vanilla JS). All text from the database goes through esc()
// before it touches the DOM.
const $ = (s, r = document) => r.querySelector(s);
const app = document.getElementById('app');
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const when = (iso) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const STATUS = ['new', 'contacted', 'qualified', 'closed', 'spam'];
const TYPE = { 'demo-request': 'Demo request', newsletter: 'Newsletter', feedback: 'Feedback' };
const sk = (w = '100%', h = 18) => `<i class="sk" style="width:${w};height:${h}px"></i>`;

async function api(path, opts = {}) {
  const res = await fetch('/api/admin/' + path, { credentials: 'same-origin', ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  if (res.status === 401 && path !== 'login') { showLogin(); throw new Error('unauthorised'); }
  return res;
}
const toast = (msg) => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.append(t); setTimeout(() => t.remove(), 2400); };

/* ------------------------------------------------------------------ login */
function showLogin(note = '') {
  app.innerHTML = `<div class="login"><form class="login-card" id="lf" autocomplete="on">
    <div class="brand"><img src="/favicon-192.png" alt="" width="38" height="38"><span>Sarasvi</span></div>
    <h1>Admin sign in</h1><p>Leads, feedback and website statistics.</p>
    <label for="em">Email</label><input id="em" type="email" autocomplete="username" required>
    <label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" required>
    <div class="err" id="le" role="alert">${esc(note)}</div>
    <button class="btn pri" style="width:100%;margin-top:8px" type="submit">Sign in</button></form></div>`;
  $('#lf').addEventListener('submit', async (e) => {
    e.preventDefault(); const b = $('#lf button'); b.disabled = true; $('#le').textContent = '';
    try {
      const r = await fetch('/api/admin/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: $('#em').value, password: $('#pw').value }) });
      if (r.ok) return boot();
      const j = await r.json().catch(() => ({}));
      $('#le').textContent = r.status === 429 ? 'Too many attempts. Try again in 15 minutes.' : j.error === 'not_configured' ? 'Admin login is not set up yet (ADMIN_PASSWORD is missing in Vercel).' : 'Wrong email or password.';
    } catch { $('#le').textContent = 'Network error. Try again.'; }
    b.disabled = false;
  });
}

/* ------------------------------------------------------------------ shell */
const PAGES = { dashboard: 'Dashboard', leads: 'Leads', feedback: 'Feedback', visitors: 'Visitors', settings: 'Settings' };
let badges = { leads: 0, feedback: 0 };
function shell() {
  app.innerHTML = `<div class="shell"><aside class="side" id="side">
    <div class="brand"><img src="/favicon-192.png" alt="" width="38" height="38"><span>Sarasvi</span></div>
    <nav class="nav" id="nav">${Object.entries(PAGES).map(([k, v]) => `<a href="#/${k}" data-p="${k}">${v}<span class="badge" id="b-${k}" hidden></span></a>`).join('')}</nav>
    <div class="foot"><button class="btn sm" id="out" style="width:100%">Sign out</button><p>Signed in as admin</p></div></aside>
    <main class="main" id="main"></main></div>`;
  $('#out').onclick = async () => { await fetch('/api/admin/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } }); showLogin('Signed out.'); };
  $('#nav').addEventListener('click', () => $('#side').classList.remove('open'));
}
function setBadges() { for (const k of ['leads', 'feedback']) { const el = $('#b-' + k); if (el) { el.hidden = !badges[k]; el.textContent = badges[k]; } } }
const head = (title, extra = '') => `<div class="top"><button class="btn menu-btn" id="mb" aria-label="Menu">☰</button><h1>${title}</h1>${extra}</div>`;
function wireMenu() { const m = $('#mb'); if (m) m.onclick = () => $('#side').classList.toggle('open'); }

/* ------------------------------------------------------------- dashboard */
let days = 30;
async function dashboard() {
  const main = $('#main');
  main.innerHTML = head('Dashboard', `<div class="seg" id="seg">${[7, 30, 90].map((d) => `<button data-d="${d}" class="${d === days ? 'on' : ''}">${d} days</button>`).join('')}</div>`) +
    `<div class="grid g4">${[1, 2, 3, 4].map(() => `<div class="card">${sk('50%', 14)}<div style="margin:12px 0">${sk('40%', 38)}</div>${sk('30%', 12)}</div>`).join('')}</div>
     <div class="card" style="margin-top:14px">${sk('100%', 220)}</div>`;
  wireMenu(); $('#seg').onclick = (e) => { const d = e.target.dataset.d; if (d) { days = +d; dashboard(); } };
  let s;
  try { const r = await api('stats?days=' + days); const j = await r.json(); if (!j.ok) throw 0; s = j.stats; }
  catch (e) { if (e.message !== 'unauthorised') main.innerHTML += `<p class="err">Could not load statistics. Check the Supabase settings and that both SQL migrations were run.</p>`; return; }
  badges = { leads: s.all_time.new_leads, feedback: s.all_time.pending_feedback }; setBadges();
  const delta = (cur, prev) => { if (!prev && !cur) return '<span class="delta flat">no change</span>'; if (!prev) return '<span class="delta up">new</span>'; const p = Math.round(((cur - prev) / prev) * 100); return `<span class="delta ${p > 0 ? 'up' : p < 0 ? 'down' : 'flat'}">${p > 0 ? '▲' : p < 0 ? '▼' : '•'} ${Math.abs(p)}% vs previous ${s.days} days</span>`; };
  const t = s.totals, pv = s.previous, conv = t.visitors ? ((t.leads / t.visitors) * 100).toFixed(1) : '0.0';
  const kpi = (l, v, d) => `<div class="card kpi"><div class="lbl">${l}</div><div class="val">${v}</div>${d}</div>`;
  const list = (rows, key, val, label) => rows.length ? `<ul class="list">${rows.map((r) => { const max = Math.max(...rows.map((x) => x[val])); return `<li><span class="k" title="${esc(r[key])}">${esc(r[key])}</span><span class="bar"><i style="width:${Math.max(4, (r[val] / max) * 100)}%"></i></span><span class="n">${fmt(r[val])}</span></li>`; }).join('')}</ul>` : `<div class="empty">No ${label} yet</div>`;
  const f = s.funnel, fmax = Math.max(1, f.visitors);
  const step = (l, n) => `<div class="step"><div class="fb" style="width:${Math.max(12, (n / fmax) * 100)}%">${fmt(n)}</div><span>${l}${f.visitors ? ` <small>(${Math.round((n / fmax) * 100)}%)</small>` : ''}</span></div>`;
  main.innerHTML = head('Dashboard', `<div class="seg" id="seg">${[7, 30, 90].map((d) => `<button data-d="${d}" class="${d === days ? 'on' : ''}">${d} days</button>`).join('')}</div>`) +
    `<div class="grid g4">${kpi('Visitors', fmt(t.visitors), delta(t.visitors, pv.visitors))}${kpi('Page views', fmt(t.page_views), delta(t.page_views, pv.page_views))}${kpi('Demo requests', fmt(t.leads), delta(t.leads, pv.leads))}${kpi('Conversion', conv + '%', `<span class="delta flat">${fmt(t.leads)} of ${fmt(t.visitors)} visitors</span>`)}</div>
    <div class="card" style="margin-top:14px"><h3>Visitors and demo requests per day</h3>${chart(s.daily)}<div class="legend"><span><i style="background:#D9732E"></i>Visitors</span><span><i style="background:#3B2314"></i>Demo requests</span></div></div>
    <div class="grid g3" style="margin-top:14px"><div class="card"><h3>Top pages</h3>${list(s.top_pages, 'path', 'views', 'page views')}</div><div class="card"><h3>Where visitors come from</h3>${list(s.sources, 'source', 'visitors', 'sources')}</div><div class="card"><h3>Countries</h3>${list(s.countries, 'country', 'visitors', 'countries')}</div></div>
    <div class="grid g3" style="margin-top:14px"><div class="card"><h3>Devices</h3>${list(s.devices, 'device', 'visitors', 'devices')}</div><div class="card"><h3>Most clicked buttons</h3>${list(s.top_clicks, 'label', 'clicks', 'clicks')}</div><div class="card"><h3>FAQ questions opened</h3>${list(s.faq, 'question', 'opens', 'FAQ opens')}</div></div>
    <div class="grid g2" style="margin-top:14px"><div class="card funnel"><h3>Visitor journey</h3>${step('Visited', f.visitors)}${step('Scrolled halfway', f.scrolled)}${step('Clicked a button', f.clicked)}${step('Sent a form', f.submitted)}</div>
    <div class="card"><h3>Other sign-ups (${s.days} days)</h3><ul class="list"><li><span class="k">Newsletter subscribers</span><span class="n">${fmt(t.subscribers)}</span></li><li><span class="k">Customer feedback</span><span class="n">${fmt(t.feedback)}</span></li><li><span class="k">Demo requests still "new"</span><span class="n">${fmt(s.all_time.new_leads)}</span></li><li><span class="k">Feedback waiting for approval</span><span class="n">${fmt(s.all_time.pending_feedback)}</span></li></ul></div></div>`;
  wireMenu(); $('#seg').onclick = (e) => { const d = e.target.dataset.d; if (d) { days = +d; dashboard(); } };
}
function chart(daily) {
  if (!daily.length) return '<div class="empty">No data yet</div>';
  const W = Math.max(320, Math.round(($('#main')?.clientWidth || 900) - 70)), H = 220, pad = { l: 34, r: 8, t: 10, b: 24 }, iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const max = Math.max(4, ...daily.map((d) => Math.max(d.visitors, d.leads)));
  const bw = iw / daily.length, y = (v) => pad.t + ih - (v / max) * ih;
  const bars = daily.map((d, i) => `<rect x="${pad.l + i * bw + bw * 0.12}" y="${y(d.visitors)}" width="${bw * 0.76}" height="${(d.visitors / max) * ih}" rx="2" fill="#D9732E"><title>${esc(d.day.slice(0, 10))}: ${d.visitors} visitors, ${d.leads} demo requests</title></rect>`).join('');
  const line = daily.map((d, i) => `${i ? 'L' : 'M'}${pad.l + i * bw + bw / 2},${y(d.leads)}`).join(' ');
  const grid = [0, 0.5, 1].map((p) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(max * p)}" y2="${y(max * p)}" stroke="#EDDFCC"/><text x="${pad.l - 6}" y="${y(max * p) + 4}" text-anchor="end" font-size="11" fill="#6B4A33">${Math.round(max * p)}</text>`).join('');
  const step = Math.ceil(daily.length / 8), xl = daily.map((d, i) => (i % step === 0 ? `<text x="${pad.l + i * bw + bw / 2}" y="${H - 6}" text-anchor="middle" font-size="11" fill="#6B4A33">${esc(d.day.slice(5, 10))}</text>` : '')).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Visitors and demo requests per day">${grid}${bars}<path d="${line}" fill="none" stroke="#3B2314" stroke-width="2.5"/>${daily.map((d, i) => (d.leads ? `<circle cx="${pad.l + i * bw + bw / 2}" cy="${y(d.leads)}" r="4" fill="#3B2314"/>` : '')).join('')}${xl}</svg>`;
}

/* ----------------------------------------------------------------- leads */
const lstate = { type: '', status: '', q: '', page: 1, pending: false, hide_spam: '1' };
let rowsCache = [];
const qs = (extra = {}) => new URLSearchParams({ ...(lstate.type && { type: lstate.type }), ...(lstate.status && { status: lstate.status }), ...(lstate.q && { q: lstate.q }), ...(lstate.pending && { pending: '1' }), ...extra }).toString();
async function leads(preset) {
  if (preset === 'feedback') Object.assign(lstate, { type: 'feedback', page: 1 }); else if (preset === 'leads') Object.assign(lstate, { type: lstate.type === 'feedback' ? '' : lstate.type, pending: false, page: 1 });
  const isFb = preset === 'feedback', main = $('#main');
  main.innerHTML = head(isFb ? 'Feedback' : 'Leads', `<a class="btn" id="exp" href="#">Export CSV</a>`) +
    `<div class="filters"><input class="grow" id="q" type="search" placeholder="Search name, email, school, message" value="${esc(lstate.q)}" aria-label="Search">
     ${isFb ? `<select id="pend" aria-label="Filter"><option value="">All feedback</option><option value="1" ${lstate.pending ? 'selected' : ''}>Waiting for approval</option></select>` : `<select id="ty" aria-label="Type"><option value="">All types</option>${Object.entries(TYPE).map(([k, v]) => `<option value="${k}" ${lstate.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`}
     <select id="st" aria-label="Status"><option value="">Any status (hide spam)</option>${STATUS.map((s) => `<option ${lstate.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
     <div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Name</th><th>Email</th><th>School</th><th>${isFb ? 'Feedback' : 'Message'}</th><th>Status</th>${isFb ? '<th>On website</th>' : ''}</tr></thead><tbody id="tb">${Array.from({ length: 6 }, () => `<tr>${Array.from({ length: isFb ? 8 : 7 }, () => `<td>${sk('80px', 14)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="pager" id="pg"></div>`;
  wireMenu();
  let t; $('#q').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { lstate.q = e.target.value; lstate.page = 1; leads(preset); $('#q').focus(); }, 350); };
  if ($('#ty')) $('#ty').onchange = (e) => { lstate.type = e.target.value; lstate.page = 1; leads(preset); };
  if ($('#pend')) $('#pend').onchange = (e) => { lstate.pending = e.target.value === '1'; lstate.page = 1; leads(preset); };
  $('#st').onchange = (e) => { lstate.status = e.target.value; lstate.page = 1; leads(preset); };
  $('#exp').onclick = (e) => { e.preventDefault(); location.href = '/api/admin/export?' + qs(); };
  const r = await api(`leads?${qs({ page: lstate.page })}`); const j = await r.json();
  if (!j.ok) { $('#tb').innerHTML = `<tr><td colspan="8" class="err">Could not load. Check Supabase settings and migrations.</td></tr>`; return; }
  rowsCache = j.rows;
  $('#tb').innerHTML = j.rows.length ? j.rows.map((x, i) => `<tr data-i="${i}"><td>${when(x.created_at)}</td><td>${esc(TYPE[x.form_type] || x.form_type)}</td><td>${esc(x.name || '—')}</td><td>${esc(x.email)}</td><td>${esc(x.institution || '—')}</td><td class="wrap">${esc((x.message || '—').slice(0, 140))}</td><td><span class="pill ${x.status}">${x.status}</span></td>${isFb ? `<td>${x.approved ? '<span class="pill live">Live</span>' : x.publish_consent ? '<span class="pill new">Needs approval</span>' : '<span class="pill">Private</span>'}</td>` : ''}</tr>`).join('') : `<tr><td colspan="8" class="empty">Nothing here yet.</td></tr>`;
  $('#tb').onclick = (e) => { const tr = e.target.closest('tr[data-i]'); if (tr) drawer(rowsCache[+tr.dataset.i], () => leads(preset)); };
  const pages = Math.max(1, Math.ceil(j.total / j.size));
  $('#pg').innerHTML = `<span>${fmt(j.total)} total</span><button class="btn sm" id="pp" ${j.page <= 1 ? 'disabled' : ''}>← Prev</button><span>Page ${j.page} of ${pages}</span><button class="btn sm" id="pn" ${j.page >= pages ? 'disabled' : ''}>Next →</button>`;
  $('#pp').onclick = () => { lstate.page--; leads(preset); }; $('#pn').onclick = () => { lstate.page++; leads(preset); };
}

function drawer(x, done) {
  const phone = (x.phone || '').replace(/[^\d+]/g, ''), wa = phone ? `https://wa.me/${phone.replace(/^\+/, '')}` : '';
  const el = document.createElement('div');
  el.innerHTML = `<div class="scrim" id="sc"></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="Details">
    <button class="btn sm" id="x" style="float:right">Close ✕</button><span class="pill ${x.status}">${x.status}</span> <span class="pill">${esc(TYPE[x.form_type] || x.form_type)}</span>
    <h2>${esc(x.name || x.email)}</h2><div style="color:var(--ink2)">${when(x.created_at)}</div>
    <div class="actions"><a class="btn pri sm" href="mailto:${esc(x.email)}?subject=${encodeURIComponent('Sarasvi: your ' + (x.form_type === 'demo-request' ? 'demo request' : 'message'))}">Reply by email</a>${wa ? `<a class="btn sm" href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}${x.phone ? `<a class="btn sm" href="tel:${esc(phone)}">Call</a>` : ''}</div>
    <dl><dt>Email</dt><dd>${esc(x.email)}</dd><dt>Phone</dt><dd>${esc(x.phone || '—')}</dd><dt>School</dt><dd>${esc(x.institution || '—')}</dd><dt>Role</dt><dd>${esc(x.role || '—')}</dd><dt>Students</dt><dd>${esc(x.students || '—')}</dd><dt>Message</dt><dd>${esc(x.message || '—')}</dd><dt>Country</dt><dd>${esc(x.country || '—')}</dd><dt>Sent from</dt><dd>${esc(x.page_url || '—')}</dd><dt>Came from</dt><dd>${esc(x.referrer || '—')}</dd><dt>Campaign</dt><dd>${esc(Object.entries(x.utm || {}).map(([k, v]) => k + '=' + v).join(', ') || '—')}</dd>${x.form_type === 'feedback' ? `<dt>Allowed to publish</dt><dd>${x.publish_consent ? 'Yes' : 'No'}</dd>` : ''}</dl>
    <label for="ds" style="font-weight:600;font-size:.86rem">Status</label><select id="ds">${STATUS.map((s) => `<option ${x.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
    <label for="dn" style="font-weight:600;font-size:.86rem;display:block;margin-top:12px">Private notes</label><textarea id="dn" maxlength="2000">${esc(x.notes || '')}</textarea>
    ${x.form_type === 'feedback' ? `<label class="row-ok" style="margin-top:8px"><input type="checkbox" id="da" style="width:auto;min-height:0" ${x.approved ? 'checked' : ''} ${x.publish_consent ? '' : 'disabled'}><span>Show this feedback on the website${x.publish_consent ? '' : ' (not allowed by the customer)'}</span></label>` : ''}
    <div class="actions" style="margin-top:16px"><button class="btn pri" id="sv">Save changes</button><button class="btn bad" id="dl" style="margin-left:auto">Delete</button></div></aside>`;
  document.body.append(el); const close = () => el.remove();
  $('#sc', el).onclick = close; $('#x', el).onclick = close;
  const onKey = (e) => { if (e.key === 'Escape') { close(); removeEventListener('keydown', onKey); } }; addEventListener('keydown', onKey);
  $('#sv', el).onclick = async () => {
    const body = { id: x.id, status: $('#ds', el).value, notes: $('#dn', el).value }; if ($('#da', el)) body.approved = $('#da', el).checked;
    const r = await api('lead', { method: 'PATCH', body: JSON.stringify(body) }); const j = await r.json();
    if (j.ok) { toast('Saved'); close(); done(); } else toast(j.error === 'no_publish_permission' ? 'Customer did not allow publishing' : 'Could not save');
  };
  $('#dl', el).onclick = async () => {
    if (!confirm(`Delete this entry from ${x.name || x.email}? This cannot be undone.`)) return;
    const r = await api('lead?id=' + encodeURIComponent(x.id), { method: 'DELETE' }); if ((await r.json()).ok) { toast('Deleted'); close(); done(); } else toast('Could not delete');
  };
}

/* -------------------------------------------------------------- visitors */
async function visitors() {
  const main = $('#main'); let ev = '';
  main.innerHTML = head('Visitors', `<select id="ef" style="width:auto" aria-label="Event type"><option value="">All activity</option>${['page_view', 'cta_click', 'form_submit', 'scroll_depth', 'faq_open', 'video_play', 'outbound_click'].map((e) => `<option>${e}</option>`).join('')}</select>`) +
    `<div class="card"><h3>Live activity <small style="font-weight:400;color:var(--ink2)">(latest 100 events)</small></h3><div class="tbl-wrap"><table><thead><tr><th>Time</th><th>Event</th><th>Page</th><th>Device</th><th>Country</th><th>Source</th><th>Details</th></tr></thead><tbody id="eb">${Array.from({ length: 8 }, () => `<tr>${Array.from({ length: 7 }, () => `<td>${sk('70px', 14)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
  wireMenu();
  const load = async () => {
    const r = await api('events' + (ev ? '?event=' + ev : '')); const j = await r.json();
    $('#eb').innerHTML = j.ok && j.rows.length ? j.rows.map((x) => `<tr style="cursor:default"><td>${when(x.created_at)}</td><td><span class="pill">${esc(x.event)}</span></td><td>${esc(x.path)}</td><td>${esc(x.device || '—')}</td><td>${esc(x.country || '—')}</td><td>${esc(x.utm_source || (x.referrer ? new URL(x.referrer, location.origin).host : 'direct'))}</td><td class="wrap">${esc(Object.entries(x.props || {}).map(([k, v]) => k + ': ' + v).join(' · '))}</td></tr>`).join('') : `<tr><td colspan="7" class="empty">No activity yet.</td></tr>`;
  };
  $('#ef').onchange = (e) => { ev = e.target.value; load(); }; load();
}

/* -------------------------------------------------------------- settings */
async function settings() {
  const main = $('#main'); main.innerHTML = head('Settings') + `<div class="card">${sk('60%', 18)}<br><br>${sk('80%', 18)}</div>`; wireMenu();
  const r = await api('health'); const j = await r.json();
  if (!j.ok) { main.innerHTML = head('Settings') + `<div class="card"><p class="err">Cannot reach the database. Check SUPABASE_URL and the service key in Vercel.</p></div>`; wireMenu(); return; }
  const h = j.health, row = (ok, t, d) => `<div class="row-ok"><span class="dot ${ok ? '' : 'off'}"></span><div><b>${t}</b><div style="color:var(--ink2);font-size:.88rem">${d}</div></div></div>`;
  main.innerHTML = head('Settings') + `<div class="card"><h3>System status</h3>
    ${row(true, 'Database (Supabase)', `Connected in ${h.database.ms} ms · ${fmt(h.database.submissions)} form entries · ${fmt(h.database.events)} analytics events<br>${esc(h.database.host)}`)}
    ${row(h.email_alerts.configured, 'Email alerts', h.email_alerts.configured ? `On, sending to ${esc(h.email_alerts.to)}` : 'Off. Add RESEND_API_KEY in Vercel to receive an email for every enquiry.')}
    ${row(h.google_analytics.configured, 'Google Analytics', h.google_analytics.configured ? `On (${esc(h.google_analytics.id)})` : 'Off (optional). Our own analytics in this panel work without it.')}
    ${row(!!h.site_url, 'Website address', esc(h.site_url || 'Using the default address'))}</div>
    <div class="card" style="margin-top:14px"><h3>How things work</h3><ul style="margin:0;padding-left:18px;color:var(--ink2)"><li>Every form on the website is saved here, even if the email alert fails.</li><li>Feedback appears on the website only when the customer ticked "may publish" <b>and</b> you approve it.</li><li>Entries marked <b>spam</b> are hidden and not counted.</li><li>Visitors in Europe are only counted after they accept the cookie banner.</li><li>Sessions last 12 hours, then you sign in again.</li></ul></div>`;
}

/* ---------------------------------------------------------------- router */
const routes = { dashboard, leads: () => leads('leads'), feedback: () => leads('feedback'), visitors, settings };
function route() {
  const p = (location.hash.replace('#/', '') || 'dashboard'); const fn = routes[p] || dashboard;
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('on', a.dataset.p === (routes[p] ? p : 'dashboard')));
  document.title = `${PAGES[p] || 'Dashboard'} · Sarasvi Admin`; fn();
}
async function boot() {
  let s; try { s = await (await fetch('/api/admin/session', { credentials: 'same-origin' })).json(); } catch { showLogin('Cannot reach the server.'); return; }
  if (!s.authenticated) { showLogin(s.configured ? '' : 'Admin login is not set up yet: add ADMIN_PASSWORD in Vercel and redeploy.'); return; }
  shell(); route();
  api('stats?days=7').then((r) => r.json()).then((j) => { if (j.ok) { badges = { leads: j.stats.all_time.new_leads, feedback: j.stats.all_time.pending_feedback }; setBadges(); } }).catch(() => {});
}
addEventListener('hashchange', () => { if ($('#nav')) route(); });
boot();
