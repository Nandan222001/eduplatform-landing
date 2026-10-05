// Converts source-images/*.jpg -> public/images/*.webp (+ dimensions manifest used by the build)
import sharp from 'sharp';
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('public/images', { recursive: true });
const dims = {};
for (const f of readdirSync('source-images').filter((f) => f.endsWith('.jpg'))) {
  const name = f.replace('.jpg', '');
  const maxW = name.endsWith('-m') ? 800 : 1440;
  const out = await sharp(`source-images/${f}`).resize({ width: maxW, withoutEnlargement: true }).webp({ quality: 78 }).toFile(`public/images/${name}.webp`);
  dims[name] = [out.width, out.height];
  console.log(name, out.width + 'x' + out.height, Math.round(out.size / 1024) + 'KB');
}
writeFileSync('scripts/image-dims.json', JSON.stringify(dims, null, 1));
