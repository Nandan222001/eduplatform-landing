/**
 * Sarasvi brand asset builder.
 *
 * Source artwork lives in source-images/brand/ (the master lockups exported from
 * the brand board). This script:
 *   1. crops the emblem out of the cream lockup and repaints the artwork backdrop
 *   2. re-maps the emblem onto the site palette and writes the round mark
 *      used in the header / footer,
 *   3. writes favicon + app icon + schema logo,
 *   4. writes the 1200x630 Open Graph card on the site's background colour.
 *
 * Run with:  npm run brand
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'source-images/brand/sarasvi-lockup-cream.png';
const OUT = 'public';
const OUT_IMG = path.join(OUT, 'images/brand');

// Palette (see README) ------------------------------------------------------
// The emblem's own navy / gold / sage is re-mapped onto the site palette so the
// mark sits inside the warm theme: navy -> ink, gold -> coral, sage -> teal.
// Colours only — the artwork itself is untouched.
const INK = [75, 36, 10];
const CORAL = [232, 102, 58];
const TEAL = [63, 168, 155];
const SHADOW = [58, 27, 6];
const GOLD = '#FF7A45';
const CREAM = '#FBF6EE';
const CREAM_RGB = [251, 246, 238];
// The site's own background (--bg), so the social card matches the page theme.
const SITE_CREAM = '#FFF4F0';
const SITE_CREAM_RGB = [255, 244, 240];
// Background of the master artwork — also what gets keyed out.
const BG = [247, 251, 253];

const dev = (r, g, b) => Math.max(Math.abs(r - BG[0]), Math.abs(g - BG[1]), Math.abs(b - BG[2]));

/** Load the master artwork as raw RGBA. */
async function loadSource() {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

/** Bounding box of artwork content inside a region, ignoring the background. */
function contentBox(img, { x0, x1, y0, y1, threshold = 12 }) {
  const { data, width, channels } = img;
  let box = { x0: Infinity, y0: Infinity, x1: -1, y1: -1 };
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * channels;
      if (dev(data[i], data[i + 1], data[i + 2]) > threshold) {
        if (x < box.x0) box.x0 = x;
        if (x > box.x1) box.x1 = x;
        if (y < box.y0) box.y0 = y;
        if (y > box.y1) box.y1 = y;
      }
    }
  }
  return box;
}

/**
 * Crop a region and repaint the flat artwork backdrop to `target`.
 *
 * The artwork's backdrop is within ~2/255 of #F7FBFD, but so are the book pages
 * and other near-white details — the two cannot be told apart by colour, so
 * keying them out punches holes in the emblem. Instead every backdrop pixel is
 * repainted to the colour it will sit on, and near-backdrop pixels are blended
 * toward it. The result is seamless on the cream badge and on the warm page
 * background, with all artwork detail intact.
 */
function recolourBackground(img, box, target, pad = 10) {
  const x0 = Math.max(0, box.x0 - pad);
  const y0 = Math.max(0, box.y0 - pad);
  const x1 = Math.min(img.width - 1, box.x1 + pad);
  const y1 = Math.min(img.height - 1, box.y1 + pad);
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const { data, width, channels } = img;
  const [tr, tg, tb] = target;

  const DEF_BG = 5; // backdrop noise measured at <= 5
  const FEATHER = 26; // blend stops here
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = ((y + y0) * width + (x + x0)) * channels;
      const o = (y * w + x) * 3;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const d = dev(r, g, b);
      if (d <= DEF_BG) {
        out[o] = tr;
        out[o + 1] = tg;
        out[o + 2] = tb;
        continue;
      }
      if (d < FEATHER) {
        // feather toward the new background so no bluish fringe survives
        const t = (d - DEF_BG) / (FEATHER - DEF_BG);
        out[o] = Math.round(tr + (r - tr) * t);
        out[o + 1] = Math.round(tg + (g - tg) * t);
        out[o + 2] = Math.round(tb + (b - tb) * t);
        continue;
      }
      out[o] = r;
      out[o + 1] = g;
      out[o + 2] = b;
    }
  }
  return sharp(out, { raw: { width: w, height: h, channels: 3 } });
}

/**
 * Re-map the emblem onto the site palette by hue: the navy artwork -> ink, the
 * gold ornaments -> coral, the sage lotus leaves -> teal. Lightness — i.e. every
 * brush stroke of the original — is preserved, so this is a colour change only.
 */
function sitePalette(img) {
  // source hue anchors, measured from the artwork
  const ANCHORS = [
    { h: 204, rgb: INK, refS: 0.8 }, // sari + linework (deeply saturated blue)
    { h: 45, rgb: CORAL, refS: 0.45 }, // ornaments, veena, halo
    { h: 163, rgb: TEAL, refS: 0.35 }, // lotus leaves behind the figure
  ];
  const { data, width, height, channels } = img;
  const out = Buffer.from(data);
  const R = 255;
  const srgb = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const hsl = (r, g, b) => {
    r /= R; g /= R; b /= R;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) {
      if (mx === r) h = ((g - b) / d) % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    const l = (mx + mn) / 2;
    return { h, s: d ? d / (1 - Math.abs(2 * l - 1)) : 0, l };
  };
  const fromHsl = (h, s, l) => {
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
    const [r, g, b] =
      h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return [(r + m) * R, (g + m) * R, (b + m) * R];
  };
  const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

  for (let p = 0; p < width * height; p++) {
    const i = p * channels;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (data[i + 3] === 0) continue;
    const { h, s, l } = hsl(r, g, b);
    const lum = 0.2126 * srgb(r / R) + 0.7152 * srgb(g / R) + 0.0722 * srgb(b / R);

    // greys (page edges, faint linework, the tagline): keep the light, warm the dark
    if (s < 0.1) {
      if (lum > 0.78) continue;
      out[i] = r + (SHADOW[0] - r) * 0.5;
      out[i + 1] = g + (SHADOW[1] - g) * 0.5;
      out[i + 2] = b + (SHADOW[2] - b) * 0.5;
      continue;
    }

    let sum = 0, nearest = 0, nearestD = 999;
    const w = ANCHORS.map((a, k) => {
      const d = hueDist(h, a.h);
      if (d < nearestD) { nearestD = d; nearest = k; }
      // A tight lobe keeps the blue veil from blending into the leaf green.
      const v = d > 20 ? 0 : Math.pow(Math.cos((d / 20) * (Math.PI / 2)), 2);
      sum += v;
      return v;
    });
    if (sum <= 0) { w.fill(0); w[nearest] = 1; sum = 1; }

    let tr = 0, tg = 0, tb = 0;
    ANCHORS.forEach((a, k) => { const q = w[k] / sum; tr += a.rgb[0] * q; tg += a.rgb[1] * q; tb += a.rgb[2] * q; });

    const t = hsl(tr, tg, tb);
    const ratio = Math.min(1.15, Math.max(0.12, s / ANCHORS[nearest].refS));
    let outS = Math.min(1, t.s * ratio);
    if (l > 0.72) outS *= 1 - ((l - 0.72) / 0.28) * 0.8; // halos stay soft
    const hue = t.h + (h - ANCHORS[nearest].h) * 0.25; // a little variety survives
    const [nr, ng, nb] = fromHsl(hue, outS, l);
    out[i] = nr; out[i + 1] = ng; out[i + 2] = nb;
  }
  return sharp(out, { raw: { width, height, channels: 3 } });
}

/** Mask an image to a centred circle, with a 1px feathered rim. */
async function maskToCircle(pngBuffer, diameterInset = 0) {
  const meta = await sharp(pngBuffer).metadata();
  const size = Math.min(meta.width, meta.height) - diameterInset * 2;
  const r = size / 2;
  const cx = meta.width / 2;
  const cy = meta.height / 2;
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${
      meta.height
    }"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/></svg>`
  );
  return sharp(pngBuffer)
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

/** Trim fully transparent rows/cols so the mark has a tight box. */
async function trim(buf, width, height) {
  const { data, info } = await sharp(buf, { raw: { width, height, channels: 4 } })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * c + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;
  const out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    data.copy(out, y * cw * 4, ((y + y0) * w + x0) * c, ((y + y0) * w + x0 + cw) * c);
  }
  return sharp(out, { raw: { width: cw, height: ch, channels: 4 } }).png();
}

async function main() {
  const img = await loadSource();
  console.log(`source ${SRC} — ${img.width}x${img.height}`);

  // The emblem sits above the wordmark. The gold leaf accent (x >= 845) and the
  // wordmark's cap "S" (which starts at y = 524) are excluded from the search
  // window so only the emblem is lifted.
  const emblem = contentBox(img, { x0: 120, x1: 845, y0: 90, y1: 523 });
  console.log('emblem box', emblem, `w=${emblem.x1 - emblem.x0 + 1} h=${emblem.y1 - emblem.y0 + 1}`);

  console.log('repainting emblem backdrop to the badge cream');

  await mkdir(OUT_IMG, { recursive: true });
  // The header renders the mark at 34px; 256px covers 3x DPR with room to spare.
  // The emblem is repainted onto the badge cream and clipped to a circle, so it
  // sits seamlessly inside the round logo chip.
  const emblemSite = await recolourBackground(img, emblem, CREAM_RGB, 8)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const markPng = await sharp(
    await sitePalette({
      data: emblemSite.data,
      width: emblemSite.info.width,
      height: emblemSite.info.height,
      channels: emblemSite.info.channels,
    })
      .trim()
      .resize({ width: 256, fit: 'inside' })
      .png({ compressionLevel: 9, palette: true, quality: 92, effort: 10 })
      .toBuffer()
  )
    .png()
    .toBuffer();
  const markPngMasked = await maskToCircle(markPng, 1);
  await writeFile(path.join(OUT_IMG, 'sarasvi-mark.png'), markPngMasked);
  const markSize = await sharp(markPngMasked).metadata();
  console.log(
    `wrote ${OUT_IMG}/sarasvi-mark.png (${markSize.width}x${markSize.height}, ${Math.round(
      markPngMasked.length / 1024
    )} KB)`
  );

  const composed = async (size, bg, circle) => {
    const inner = Math.round(size * (circle ? 0.78 : 0.94));
    const scale = Math.min(inner / markSize.width, inner / markSize.height);
    const w = Math.max(1, Math.round(markSize.width * scale));
    const h = Math.max(1, Math.round(markSize.height * scale));
    const layers = [];
    if (circle) {
      layers.push({
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${
            size / 2
          }" r="${size * 0.475}" fill="${circle}"/><circle cx="${size / 2}" cy="${size / 2}" r="${
            size * 0.475 - Math.max(1, size * 0.012)
          }" fill="none" stroke="${GOLD}" stroke-width="${Math.max(1, size * 0.018)}" opacity=".5"/></svg>`
        ),
        top: 0,
        left: 0,
      });
    }
    layers.push({
      input: await sharp(markPngMasked).resize(w, h).png().toBuffer(),
      top: Math.round((size - h) / 2),
      left: Math.round((size - w) / 2),
    });
    return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
      .composite(layers)
      .png();
  };

  // favicon: cream badge (brand board's gold-on-white favicon treatment)
  await (await composed(64, { r: 0, g: 0, b: 0, alpha: 0 }, CREAM)).toFile(path.join(OUT, 'favicon.png'));
  await (await composed(192, { r: 0, g: 0, b: 0, alpha: 0 }, CREAM)).toFile(path.join(OUT, 'favicon-192.png'));
  // app icon / schema logo: opaque so iOS doesn't composite on black
  await (await composed(512, CREAM, CREAM)).png().toFile(path.join(OUT, 'logo-512.png'));
  await (await composed(180, CREAM, CREAM)).png().toFile(path.join(OUT, 'apple-touch-icon.png'));
  console.log(`wrote favicon.png, favicon-192.png, apple-touch-icon.png, logo-512.png`);

  // Open Graph card: the full lockup (emblem + leaf + wordmark + tagline) is keyed
  // to transparency and set on the site's own warm background, so it matches the
  // page theme instead of carrying the artwork's flat backdrop.
  const lockBox = { x0: 290, y0: 125, x1: 915, y1: 740 };
  const lockSite = await recolourBackground(img, lockBox, SITE_CREAM_RGB, 6)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ogLockup = await (await sitePalette({
    data: lockSite.data,
    width: lockSite.info.width,
    height: lockSite.info.height,
    channels: lockSite.info.channels,
  }))
    .trim()
    .resize({ height: 520, fit: 'inside' })
    .jpeg({ quality: 95 })
    .toBuffer();
  const ogMeta = await sharp(ogLockup).metadata();
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: SITE_CREAM } })
    .composite([
      { input: ogLockup, top: Math.round((630 - ogMeta.height) / 2), left: Math.round((1200 - ogMeta.width) / 2) },
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect x="26" y="26" width="1148" height="578" rx="18" fill="none" stroke="${GOLD}" stroke-width="2" opacity=".5"/></svg>`
        ),
        top: 0,
        left: 0,
      },
    ])
    .jpeg({ quality: 88, chromaSubsampling: '4:4:4' })
    .toFile(path.join(OUT, 'og-image.jpg'));
  console.log('wrote og-image.jpg (1200x630, on the site background)');

  // verification renders (not part of the site)
  await mkdir('/tmp/brand-check', { recursive: true });
  await sharp({ create: { width: 900, height: 300, channels: 4, background: SITE_CREAM } })
    .composite([
      { input: await sharp(markPng).resize({ height: 220 }).toBuffer(), top: 40, left: 40 },
      {
        input: await sharp(markPng).resize({ height: 120 }).toBuffer(),
        top: 90,
        left: 300,
      },
      {
        input: await sharp(markPng).resize({ height: 44 }).toBuffer(),
        top: 128,
        left: 470,
      },
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="470" height="300"><rect width="470" height="300" fill="#2A1508"/></svg>`
        ),
        top: 0,
        left: 430,
      },
      { input: await sharp(markPng).resize({ height: 160 }).toBuffer(), top: 70, left: 500 },
      {
        input: await (await composed(96, { r: 0, g: 0, b: 0, alpha: 0 }, CREAM)).png().toBuffer(),
        top: 100,
        left: 760,
      },
    ])
    .png()
    .toFile('/tmp/brand-check/mark-sizes.png');
  console.log('verification render: /tmp/brand-check/mark-sizes.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
