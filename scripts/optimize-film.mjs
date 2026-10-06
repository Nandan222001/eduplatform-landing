// Builds the two encodes of the brand film that ship in public/media/, from the
// 10.1 MB Gemini master (Saraswati playing the veena, 1280x720, 20 s).
//
//   sarasvi-blessing.mp4      the film itself — sharp, 1280x720, with its music.
//                             Used by the "watch with sound" lightbox, i.e. the
//                             one place it is played properly.
//   sarasvi-blessing-bg.mp4   the page's own background — the same 20 s, blurred,
//                             muted, ~1 MB. This is the file the whole site sits
//                             on; it is scrubbed by the scroll wheel.
//   sarasvi-blessing-bg-1..4  four stills cut from that same blurred chain — the
//                             mobile background, and the first paint before any
//                             video byte arrives (so nothing ever pops from sharp
//                             to soft).
//   sarasvi-blessing-p1.webp  one sharp still for the lightbox poster and the
//                             JSON-LD thumbnailUrl.
//
// Why keyframes are dense: the film is *scrubbed* — every scroll tick moves
// `currentTime` — so the decoder has to produce an arbitrary frame instantly,
// dozens of times a second. `-g 4 -sc_threshold 0` puts a keyframe every 4 frames
// (120 of them) and `-bf 0` keeps decode order trivial. That costs size, which the
// sharp encode pays for with CRF 34 + a light denoise (the master is a grainy
// diffusion render and grain is the most expensive thing to hand an encoder).
//
// Why the background is blurred *in the file*: it sits behind every word on the
// site, so it must be quiet — and baking the blur in is free at runtime, where a
// CSS blur() on a full-viewport layer is one of the most expensive things you can
// ask a compositor to do every frame. The blur is kept light (sigma 5) and given a
// touch of contrast/saturation, because the page's wash in front of it is thin on
// purpose: the film is meant to be seen, not deduced.
//
// Measured and rejected: VP9/WebM (~3x larger than H.264 at equal keyframe
// density on this content) and 12 fps (more bytes, worse picture).
//
// Usage: npm run film   (pass a different master: npm run film -- path/to/master.mp4)
// Needs ffmpeg on PATH, or set FFMPEG_BIN=/path/to/ffmpeg.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';

const FFMPEG = process.env.FFMPEG_BIN || 'ffmpeg';
const OUT = 'public/media';

// The master ships at the repo root as uploaded; a tidy copy under source-media/
// is picked up first if you ever move it there.
const CANDIDATES = ['source-media/sarasvi-blessing.mp4', 'gemini_generated_video_5f920663.mp4'];
const SRC = process.argv[2] || CANDIDATES.find((p) => existsSync(p));

const W = 1280;
const H = 720;
const DENOISE = 'hqdn3d=2.2:2:7:7';   // smooth the render's grain; keep the drawing
const SOFT = `scale=${W}:${H},gblur=sigma=5:steps=2,eq=contrast=1.06:saturation=1.08`;   // the background's quiet
const SHARP = `scale=${W}:${H},${DENOISE}`;
const X264 = ['-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-level', '4.0',
  '-g', '4', '-keyint_min', '4', '-sc_threshold', '0', '-bf', '0', '-pix_fmt', 'yuv420p'];
// stills are cut at the seconds the film changes scene, so scrubbing the mobile
// background reads as the same story, just in four beats.
const STILLS = [0.2, 6.6, 13.2, 19.5];

if (!SRC) {
  console.error(`No master found. Looked for:\n  ${CANDIDATES.join('\n  ')}\nPass one explicitly: npm run film -- path/to/master.mp4`);
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });
console.log(`Master: ${SRC}\n`);

function run(label, args) {
  const res = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (res.error || res.status !== 0) {
    console.error(`\n${label} failed. Is ffmpeg installed? (set FFMPEG_BIN to point at one)`);
    process.exit(res.status || 1);
  }
  const file = args[args.length - 1];
  const kb = Math.round(statSync(file).size / 1024);
  console.log(`${label.padEnd(12)} ${file}  ${kb < 1024 ? kb + ' KB' : (kb / 1024).toFixed(1) + ' MB'}`);
}

// 1. The film, sharp, with sound — what the lightbox plays.
//    loudnorm lifts the master's quiet ambient mix (-27.8 dB) to a sane level;
//    -ar 48000 because loudnorm hands off 192 kHz, which AAC would then keep.
run('film', [
  '-i', SRC,
  '-vf', SHARP,
  ...X264, '-crf', '34',
  '-af', 'loudnorm=I=-19:TP=-1.5:LRA=11',
  '-c:a', 'aac', '-b:a', '96k', '-ac', '2', '-ar', '48000',
  '-movflags', '+faststart', '-map_metadata', '-1',
  `${OUT}/sarasvi-blessing.mp4`,
]);

// 2. The site-wide background: same 20 s, soft and silent. CRF 37 is safe here
//    because the encode is already blurred — there is no fine detail left to lose.
run('background', [
  '-i', SRC,
  '-an',
  '-vf', SOFT,
  ...X264, '-crf', '37',
  '-movflags', '+faststart', '-map_metadata', '-1',
  `${OUT}/sarasvi-blessing-bg.mp4`,
]);

// 3. Stills cut from the *blurred* chain (same Soft filter), so the mobile
//    background and the first paint match the video exactly.
STILLS.forEach((t, i) => {
  run(`still ${i + 1}`, [
    '-ss', String(t), '-i', SRC,
    '-frames:v', '1', '-vf', SOFT,
    '-c:v', 'libwebp', '-quality', '72', '-compression_level', '6',
    `${OUT}/sarasvi-blessing-bg-${i + 1}.webp`,
  ]);
});

// 4. One sharp still: the lightbox poster, and the thumbnailUrl in the page's JSON-LD.
run('poster', [
  '-ss', String(STILLS[0]), '-i', SRC,
  '-frames:v', '1', '-vf', SHARP,
  '-c:v', 'libwebp', '-quality', '70', '-compression_level', '6',
  `${OUT}/sarasvi-blessing-p1.webp`,
]);

console.log('\nDone — one 1 MB background for the whole site, one 3 MB film for the lightbox.');
