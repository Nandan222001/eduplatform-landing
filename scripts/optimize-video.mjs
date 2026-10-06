// Compresses the master product film in source-media/ into the web renditions in
// public/media/ that <VideoTour> ships:
//
//   sarasvi-tour.webm          VP9  — served first, ~1.5 MB (12.8 MB master)
//   sarasvi-tour.mp4           H.264 — universal fallback for older Safari/Edge, ~1.8 MB
//   sarasvi-tour-poster.webp   the still frame shown before anyone presses play, ~46 KB
//
// Usage: npm run video   (pass a path to encode a different master, e.g. npm run video -- source-media/other.mp4)
// Needs ffmpeg on PATH, or set FFMPEG_BIN=/path/to/ffmpeg.
import { spawnSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';

const FFMPEG = process.env.FFMPEG_BIN || 'ffmpeg';
const SRC = process.argv[2] || 'source-media/sarasvi-tour.mp4';
const OUT = 'public/media';
const WIDTH = 720; // portrait of the video box; 1260x720 keeps the site's 7:4 crop

mkdirSync(OUT, { recursive: true });

function run(label, args) {
  const res = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (res.error || res.status !== 0) {
    console.error(`\n${label} failed. Is ffmpeg installed? (set FFMPEG_BIN to point at one)`);
    process.exit(res.status || 1);
  }
  const [file] = args.slice(-1);
  console.log(`${label.padEnd(12)} ${file}  ${Math.round(statSync(file).size / 1024)} KB`);
}

// VP9/Opus — the primary source, best quality per byte and supported everywhere but old iOS.
run('webm', [
  '-i', SRC,
  '-vf', `scale=-2:${WIDTH}`,
  '-c:v', 'libvpx-vp9', '-crf', '37', '-b:v', '0', '-row-mt', '1', '-cpu-used', '2', '-deadline', 'good',
  '-c:a', 'libopus', '-b:a', '64k',
  `${OUT}/sarasvi-tour.webm`,
]);

// H.264/AAC — fallback; faststart moves the index to the front so it can start before it is fully downloaded.
run('mp4', [
  '-i', SRC,
  '-vf', `scale=-2:${WIDTH}`,
  '-c:v', 'libx264', '-crf', '26', '-preset', 'slow', '-profile:v', 'high', '-level', '4.0', '-g', '48',
  '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '96k', '-ac', '2',
  '-movflags', '+faststart',
  `${OUT}/sarasvi-tour.mp4`,
]);

// Poster: the campus frame at 0.3s, whatever the visitor sees before pressing play.
run('poster', [
  '-ss', '0.3', '-i', SRC,
  '-frames:v', '1', '-vf', 'scale=1260:-2',
  '-c:v', 'libwebp', '-quality', '74', '-compression_level', '6',
  `${OUT}/sarasvi-tour-poster.webp`,
]);

console.log('\nDone — the page only fetches one of the two video files, and only after a play click.');
