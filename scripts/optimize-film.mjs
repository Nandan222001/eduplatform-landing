// Builds the scroll-driven brand film in public/media/ from the Gemini master.
//
//   sarasvi-blessing.mp4        H.264 — scrub master, ~4 MB (10.1 MB master)
//   sarasvi-blessing-p1..p4.webp the four stills the player cross-fades while the
//                                browser is still fetching/decoding (≈35 KB each)
//   sarasvi-blessing-bg.webp    160px blurred still painted behind the frame (~4 KB)
//
// Why this encode is different from the product tour (npm run video):
// the clip is *scrubbed* — every scroll tick moves `currentTime` — so the browser
// has to decode a frame at an arbitrary position, instantly, dozens of times a
// second. That only stays smooth when keyframes are dense, so the encode keeps a
// keyframe every 4 frames (`-g 4 -sc_threshold 0`) instead of every 2 seconds.
// The price of that is size, which is paid for with CRF 37 + a light denoise
// (the master is a grainy diffusion render, and grain is the most expensive
// thing you can hand an encoder). 12 fps encodes were tested and rejected: they
// cost *more* bytes at this CRF while looking worse.
//
// VP9/WebM was also tested and dropped: at an equal keyframe density it came out
// ~3x larger than H.264 on this content, and H.264 plays everywhere.
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

// 1280x720 is the master's own size; the player shows it at <=1000px wide.
const W = 1280;
const H = 720;
// hqdn3d smooths the render's grain so the encoder can spend its bits on the
// illustration instead. Kept gentle — this is a devotional image, not a face to be
// plasticised.
const DENOISE = 'hqdn3d=2.2:2:7:7';
// Stills the player cross-fades; times chosen to cover the whole 20s at a glance.
const POSTERS = [0.2, 6.6, 13.2, 19.5];

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
  console.log(`${label.padEnd(14)} ${file}  ${Math.round(statSync(file).size / 1024)} KB`);
}

// 1. The scrub master. Every 4th frame is a keyframe and there are no B-frames,
//    so any scroll position is at most 4 frames from a clean decode point.
//    Audio stays in the file: the same encode is reused for full playback with
//    sound ("Watch with sound"), so shipping a second file would be waste.
run('scrub mp4', [
  '-i', SRC,
  '-vf', `scale=${W}:${H},${DENOISE}`,
  '-c:v', 'libx264', '-crf', '34', '-preset', 'slow', '-profile:v', 'high', '-level', '4.0',
  '-g', '4', '-keyint_min', '4', '-sc_threshold', '0', '-bf', '0',
  '-pix_fmt', 'yuv420p',
  // loudnorm lifts the master's quiet ambient mix to a sane playback level;
  // -ar 48000 because loudnorm hands off 192 kHz, which AAC would then keep.
  '-af', 'loudnorm=I=-19:TP=-1.5:LRA=11',
  '-c:a', 'aac', '-b:a', '96k', '-ac', '2', '-ar', '48000',
  '-movflags', '+faststart',
  '-map_metadata', '-1',
  `${OUT}/sarasvi-blessing.mp4`,
]);

// 2. Four stills, webp, sized for the widest placement (1000px box on 1x/2x).
POSTERS.forEach((t, i) => {
  run(`poster ${i + 1}`, [
    '-ss', String(t), '-i', SRC,
    '-frames:v', '1',
    '-vf', `scale=${W}:${H},${DENOISE}`,
    '-c:v', 'libwebp', '-quality', '70', '-compression_level', '6',
    `${OUT}/sarasvi-blessing-p${i + 1}.webp`,
  ]);
});

// 3. A tiny blurred still stretched behind the frame so the letterboxed stage
//    picks up the film's own palette. 160px wide is enough once blurred.
run('backdrop', [
  '-ss', '6.6', '-i', SRC,
  '-frames:v', '1',
  '-vf', `scale=160:90,gblur=sigma=14,${DENOISE}`,
  '-c:v', 'libwebp', '-quality', '62', '-compression_level', '6',
  `${OUT}/sarasvi-blessing-bg.webp`,
]);

console.log('\nDone — the film is one 4 MB file, keyframed for scrubbing.');
