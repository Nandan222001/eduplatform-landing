// Real-pixel contrast audit for the scrolling film background.
//
// Answers one question honestly: "is the copy still readable with the film showing through?"
// It measures the pixels a reader actually looks at, not the CSS we hope is applied.
//
// Method
//   For every text block fully inside the viewport we take two screenshots: A with the text,
//   B with all text forced transparent. Their difference IS the glyph mask, so the background
//   sampled for each block is the real composited background *under its own letters* - the film,
//   the pools, the card fills and everything else included. Contrast is WCAG 2.1 relative
//   luminance; the threshold is 4.5:1, or 3:1 for large text (>=24px, or >=18.66px bold).
//
// Guards against fooling ourselves
//   * the page is scrolled through once first, so lazy images have painted;
//   * scrolling is forced instant - `scrollIntoView` on a `scroll-behavior: smooth` page is
//     still animating during the wait, and you end up measuring an off-screen box;
//   * animations are PAUSED rather than deleted (`animation: none` can remove a keyframe-applied
//     background and invent failures), and only the film is frozen, through its own dock button;
//   * text sitting under the translucent sticky header is skipped, because its "background" is
//     the nav, not the page;
//   * before measuring, two identical screenshots are compared: if pixels moved, the frame is
//     retried and then reported as unsettled instead of silently producing numbers.
//
// Usage
//   CHROME_PATH=/path/to/chrome node scripts/contrast-audit.mjs [url]
//   npm i --no-save puppeteer-core      # the only extra dependency, at runtime only
//   For a portable build, also export its shared libs:  LD_LIBRARY_PATH=/path/to/lib
//   The site must be running (npm run dev) and, ideally, be empty of real user data.
//
// Exit code is 0 even when blocks fail: read the report, do not wire it into CI as-is.

const URL_TO_AUDIT = process.argv[2] || process.env.AUDIT_URL || 'http://localhost:4321/';
const CHROME_PATH = process.env.CHROME_PATH;
const VIEWPORT = { width: 1440, height: 900 };

const HIDE = `*{color:transparent!important;-webkit-text-fill-color:transparent!important;
  text-shadow:none!important} .grad-text{background:none!important}`;
const STILL = `html{scroll-behavior:auto!important}
  *,*::before,*::after{animation-play-state:paused!important;transition:none!important}`;

let puppeteer;
try {
  puppeteer = (await import('puppeteer-core')).default;
} catch {
  console.error('contrast-audit needs puppeteer-core:  npm i --no-save puppeteer-core');
  process.exit(1);
}
if (!CHROME_PATH) {
  console.error('set CHROME_PATH to a Chromium/Chrome binary, e.g.\n  CHROME_PATH=/usr/bin/chromium node scripts/contrast-audit.mjs');
  process.exit(1);
}

const srgb = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const parseColor = (s) => (s.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);

// Decoding happens inside the page: the browser already ships a PNG decoder.
const pixels = (a64, b64, boxes) => page.evaluate(async (a, b, list) => {
  const load = async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); return i; };
  const [ia, ib] = await Promise.all([load(a), load(b)]);
  const cv = document.createElement('canvas'); cv.width = ia.width; cv.height = ia.height;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(ia, 0, 0); const A = cx.getImageData(0, 0, ia.width, ia.height).data;
  cx.clearRect(0, 0, cv.width, cv.height); cx.drawImage(ib, 0, 0);
  const B = cx.getImageData(0, 0, ib.width, ib.height).data;
  const W = ia.width, H = ia.height;

  // how much moved between the two shots: 0 means the two passes are comparable
  let moved = 0;
  for (let i = 0; i < A.length; i += 4) {
    if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 48) moved++;
  }

  // for every box: collect the background pixels that its own glyphs cover
  const glyphs = list.map((box) => {
    const x0 = Math.max(0, box.x), y0 = Math.max(0, box.y);
    const x1 = Math.min(W, box.x + box.w), y1 = Math.min(H, box.y + box.h);
    const hide = box.hide || [];   // sub-rects to ignore (e.g. an <a> wrapper with no text of its own)
    const bg = [];
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      if (hide.some((h) => x >= h.x0 && x < h.x1 && y >= h.y0 && y < h.y1)) continue;
      const i = (y * W + x) * 4;
      if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 48) {
        bg.push([B[i], B[i + 1], B[i + 2]]);
      }
    }
    return bg;
  });
  return { moved: moved / (A.length / 4), glyphs };
}, a64, b64, boxes);

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH, headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars',
         '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
}).catch((e) => {
  console.error(`could not launch ${CHROME_PATH}: ${e.message.split('\n')[0]}`);
  console.error('for a portable build, point LD_LIBRARY_PATH at the shared libraries shipped beside it');
  process.exit(1);
});
const page = await browser.newPage();
await page.setViewport(VIEWPORT);
await page.goto(URL_TO_AUDIT, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));

// warm lazy images by walking the page once
const pageH = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < pageH; y += 800) {
  await page.evaluate((yy) => scrollTo(0, yy), y);
  await new Promise((r) => setTimeout(r, 220));
}
await page.evaluate(() => scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 800));

await page.addStyleTag({ content: STILL });
await page.evaluate(() => {
  document.querySelector('[data-film-toggle]')?.click();          // freeze the film
  for (let i = 1; i < 100000; i++) { clearInterval(i); clearTimeout(i); }   // carousels, marquees
});
await new Promise((r) => setTimeout(r, 900));

// every top-level block that declares a wash: the home page's sections, or the single
// `main.legal` of the policy pages - so the legal pages get audited too, not just the home page
const sections = await page.evaluate(() => [...document.querySelectorAll('[data-film-wash]')]
  .filter((el) => !el.parentElement.closest('[data-film-wash]'))
  .map((el) => ({ id: el.id || el.className.split(' ')[0], top: el.getBoundingClientRect().top + scrollY, h: el.offsetHeight }))
  .filter((s) => s.id && s.h >= 200));

const collect = () => page.evaluate(() => {
  const header = document.querySelector('header,.site-header,nav');
  const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
  const out = [];
  for (const el of document.querySelectorAll('h1,h2,h3,h4,p,li,span,button,a')) {
    const text = (el.textContent || '').trim();
    if (!text || el.children.length > 0) continue;                 // leaf blocks only
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.5) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 11) continue;
    if (r.left < 0 || r.right > innerWidth) continue;              // a clipped box samples someone else's pixels
    if (r.top < headerBottom || r.bottom > innerHeight) continue;  // under the nav, or off-screen
    out.push({ text: text.slice(0, 40), color: cs.color, fill: cs.webkitTextFillColor,
               size: parseFloat(cs.fontSize), weight: cs.fontWeight,
               x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
  }
  return out;
});

console.log(`auditing ${URL_TO_AUDIT} at ${VIEWPORT.width}x${VIEWPORT.height}`);
let total = 0, measured = 0, gradient = 0, unmeasured = 0, unsettled = [], failures = [];

for (const section of sections) {
  await page.evaluate((yy) => scrollTo(0, yy), Math.max(0, Math.round(section.top + section.h * 0.35)));
  await new Promise((r) => setTimeout(r, 1100));

  let shotA = await page.screenshot({ encoding: 'base64' });
  let check = await pixels(shotA, await page.screenshot({ encoding: 'base64' }), []);
  if (check.moved > 0.004) {                                        // something is still animating
    await new Promise((r) => setTimeout(r, 1500));
    shotA = await page.screenshot({ encoding: 'base64' });
    check = await pixels(shotA, await page.screenshot({ encoding: 'base64' }), []);
    if (check.moved > 0.004) unsettled.push(`${section.id} (${(check.moved * 100).toFixed(2)}% of pixels move)`);
  }

  const boxes = await collect();
  if (!boxes.length) continue;

  await page.addStyleTag({ content: HIDE });
  await new Promise((r) => setTimeout(r, 400));
  const shotB = await page.screenshot({ encoding: 'base64' });
  await page.evaluate(() => { const styles = document.querySelectorAll('style'); styles[styles.length - 1]?.remove(); });
  await new Promise((r) => setTimeout(r, 300));

  const { glyphs } = await pixels(shotA, shotB, boxes);
  boxes.forEach((box, i) => {
    total++;
    const bg = glyphs[i];
    if (box.fill === 'rgba(0, 0, 0, 0)' || box.color === 'rgba(0, 0, 0, 0)') { gradient++; return; }
    if (bg.length < 25) { unmeasured++; return; }
    measured++;
    const byLuminance = bg.slice().sort((p, q) => lum(p) - lum(q));
    const pick = (f) => byLuminance[Math.min(byLuminance.length - 1, Math.round(f * (byLuminance.length - 1)))];
    const colour = parseColor(box.color);
    const large = box.size >= 24 || (box.size >= 18.66 && Number(box.weight) >= 700);
    const need = large ? 3.0 : 4.5;
    const typical = contrast(colour, pick(0.5));                    // the pixel most readers land on
    const worst = Math.min(typical, contrast(colour, pick(0.06)), contrast(colour, pick(0.94)));
    if (typical < need) failures.push({ section: section.id, ...box, need,
      typical: +typical.toFixed(2), worst: +worst.toFixed(2), glyphs: bg.length });
  });
}

console.log(`blocks seen ${total} · measured on real glyph pixels ${measured} · gradient/colour-only ${gradient} · too few glyph pixels ${unmeasured}`);
console.log(`frames that never settled: ${unsettled.length ? unsettled.join(', ') : 'none'}`);
console.log(`below WCAG AA on the typical pixel under the glyphs: ${failures.length}`);
failures.sort((a, b) => a.typical / a.need - b.typical / b.need).slice(0, 20).forEach((f) =>
  console.log(`  ${String(f.typical).padEnd(5)}(need ${f.need})  worst-neighbour ${String(f.worst).padEnd(5)}  ${f.section.padEnd(12)} ${String(f.size).padEnd(5)}px  ${f.color.padEnd(19)} "${f.text}"`));
if (failures.length) {
  console.log('\nEach line needs a human eye: white-on-brand-colour buttons and text inside');
  console.log('illustrations are common false alarms for this test, but text on the film showing');
  console.log('through anywhere is a real regression.');
}

await browser.close();
