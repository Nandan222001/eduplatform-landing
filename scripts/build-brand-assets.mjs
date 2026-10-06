/**
 * Sarasvi brand asset builder.
 *
 * Source artwork lives in source-images/brand/ (the master lockups exported from
 * the brand board). This script:
 *   1. lifts the emblem out of the cream lockup and keys the background away,
 *   2. writes the transparent mark used in the header / footer,
 *   3. writes favicon + app icon + schema logo,
 *   4. writes the 1200x630 Open Graph card.
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
const NAVY = '#002244';
const GOLD = '#CBA956';
const CREAM = '#FBF6EE';
const IVORY = '#F7FBFD';
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
 * Crop the emblem and turn the flat artwork background into real transparency.
 * Background pixels are found by flood-filling inwards from the crop border, so
 * light details *inside* the emblem (book pages, halo) are never punched out.
 */
function extractMark(img, box, pad = 10) {
  const x0 = Math.max(0, box.x0 - pad);
  const y0 = Math.max(0, box.y0 - pad);
  const x1 = Math.min(img.width - 1, box.x1 + pad);
  const y1 = Math.min(img.height - 1, box.y1 + pad);
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const { data, width, channels } = img;

  const DEF_BG = 6; // background noise measured at <= 5
  const FEATHER = 24; // dev at which a pixel counts as fully opaque
  const isBgish = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = ((y + y0) * width + (x + x0)) * channels;
      isBgish[y * w + x] = dev(data[i], data[i + 1], data[i + 2]) <= DEF_BG ? 1 : 0;
    }
  }

  // flood fill the background from the crop border
  const bgMask = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) {
    stack.push(x, (h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    stack.push(y * w, y * w + w - 1);
  }
  while (stack.length) {
    const p = stack.pop();
    if (bgMask[p] || !isBgish[p]) continue;
    bgMask[p] = 1;
    const x = p % w;
    const y = (p / w) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }

  // pixels within 2px of the background form the anti-aliased edge band
  const band = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (bgMask[p]) continue;
      let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (bgMask[ny * w + nx]) {
            near = true;
            break;
          }
        }
      }
      if (near) band[p] = 1;
    }
  }

  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const i = ((y + y0) * width + (x + x0)) * channels;
      const o = p * 4;
      if (bgMask[p]) {
        out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
        continue;
      }
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      let a = 255;
      if (band[p]) {
        const d = dev(r, g, b);
        a = Math.round(Math.min(1, Math.max(0, (d - DEF_BG) / (FEATHER - DEF_BG))) * 255);
        // un-blend the original background from the soft edge pixels
        const af = a / 255;
        if (af > 0.25) {
          r = Math.min(255, Math.max(0, Math.round((r - BG[0] * (1 - af)) / af)));
          g = Math.min(255, Math.max(0, Math.round((g - BG[1] * (1 - af)) / af)));
          b = Math.min(255, Math.max(0, Math.round((b - BG[2] * (1 - af)) / af)));
        }
      }
      out[o] = r;
      out[o + 1] = g;
      out[o + 2] = b;
      out[o + 3] = a;
    }
  }
  return { data: out, width: w, height: h };
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

  const mark = extractMark(img, emblem, 8);
  console.log(`keyed mark ${mark.width}x${mark.height}`);

  await mkdir(OUT_IMG, { recursive: true });
  const markTrimmed = await trim(mark.data, mark.width, mark.height);
  // The header renders the mark at 34px; 256px covers 3x DPR with room to spare.
  // Palette PNG keeps it to ~30 KB (vs ~250 KB truecolour) with no visible loss.
  const markPng = await sharp(await markTrimmed.png().toBuffer())
    .resize({ width: 256, fit: 'inside' })
    .png({ compressionLevel: 9, palette: true, quality: 92, effort: 10 })
    .toBuffer();
  await writeFile(path.join(OUT_IMG, 'sarasvi-mark.png'), markPng);
  const markSize = await sharp(markPng).metadata();
  console.log(
    `wrote ${OUT_IMG}/sarasvi-mark.png (${markSize.width}x${markSize.height}, ${Math.round(markPng.length / 1024)} KB)`
  );

  const composed = async (size, bg, circle) => {
    const inner = Math.round(size * (circle ? 0.66 : 0.94));
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
      input: await sharp(markPng).resize(w, h).png().toBuffer(),
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
  // app icon / schema logo: opaque ivory so iOS doesn't composite on black
  await (await composed(512, IVORY, CREAM)).png().toFile(path.join(OUT, 'logo-512.png'));
  await (await composed(180, IVORY, CREAM)).png().toFile(path.join(OUT, 'apple-touch-icon.png'));
  console.log(`wrote favicon.png, favicon-192.png, apple-touch-icon.png, logo-512.png`);

  // Open Graph card — the master lockup on its own background colour
  const lockup = await sharp(SRC).extract({ left: 236, top: 118, width: 728, height: 630 }).toBuffer();
  const ogLockup = await sharp(lockup).resize({ height: 566 }).toBuffer();
  const ogMeta = await sharp(ogLockup).metadata();
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: BG[0], g: BG[1], b: BG[2], alpha: 1 } } })
    .composite([
      { input: ogLockup, top: 32, left: Math.round((1200 - ogMeta.width) / 2) },
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect x="26" y="26" width="1148" height="578" rx="18" fill="none" stroke="${GOLD}" stroke-width="2" opacity=".55"/></svg>`
        ),
        top: 0,
        left: 0,
      },
    ])
    .jpeg({ quality: 88, chromaSubsampling: '4:4:4' })
    .toFile(path.join(OUT, 'og-image.jpg'));
  console.log('wrote og-image.jpg (1200x630)');

  // verification renders (not part of the site)
  await mkdir('/tmp/brand-check', { recursive: true });
  await sharp({ create: { width: 900, height: 300, channels: 4, background: IVORY } })
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
          `<svg xmlns="http://www.w3.org/2000/svg" width="470" height="300"><rect width="470" height="300" fill="${NAVY}"/></svg>`
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
