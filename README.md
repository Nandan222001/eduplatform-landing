# Sarasvi — Marketing Site (Astro)

Static, SEO-optimised landing page for **Sarasvi**, built with [Astro](https://astro.build).

> **Sarasvi — Wisdom Through Education.** AI-powered school operating system:
> web portal (Sarasvi Portal) and mobile apps (Sarasvi Mobile).

## Commands

| Command | Action |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run images` | Re-optimise `source-images/*.jpg` → `public/images/*.webp` |
| `npm run video` | Re-encode `source-media/*.mp4` → `public/media/*` (needs ffmpeg on `PATH`, or `FFMPEG_BIN=/path/to/ffmpeg`) |
| `npm run film` | Rebuild the scroll-scrubbed brand film in `public/media/` from its master (same ffmpeg requirement) |
| `npm run brand` | Rebuild favicons, app icons, header mark and the OG card from `source-images/brand/` |

## Configuration (`.env`, see `.env.example`)

- `SITE_URL` – production URL (canonical, sitemap, robots, Open Graph). **Set this before deploying.**
- `PUBLIC_FORM_ENDPOINT` – JSON POST endpoint for the demo-request and newsletter forms (Formspree, Getform, your API…). Without it, forms fall back to a prefilled `mailto:`.
- `PUBLIC_CONTACT_EMAIL` – mailbox shown in the footer / used for the fallback.

## Brand

The **site palette is unchanged** — coral, purple, teal, gold and the warm cream
background are all defined in `src/styles/global.css` under `/* TOKENS */`. Two
extra tokens serve the Sarasvi lockup:

| Token | Value | Use |
| :-- | :-- | :-- |
| `--cream` | `#FBF6EE` | Round badge behind the emblem (header + footer) |
| `--brand-accent` | `var(--primary)` (`#FF7A45`) | The "i" in the wordmark, and the footer tagline |

- **Typeface** — headings: Garamond Premier (web substitute: [EB Garamond](https://fonts.google.com/specimen/EB+Garamond)); body: [Open Sans](https://fonts.google.com/specimen/Open+Sans), both per the brand board. Self-hosted via `@fontsource-variable`, so there are no external font requests. The CSS product mockups keep the body face so they still read as software.
- **Wordmark** — the header/footer lockup is the round emblem badge plus "Sarasv" in ink with a coral "i".
- **Mark & icons** — `npm run brand` crops the emblem from `source-images/brand/sarasvi-lockup-cream.png`, repaints the artwork backdrop to the badge cream, and **re-maps the artwork's own navy / gold / sage onto the site palette** (navy → `--ink`, gold ornaments → `--primary` coral, sage lotus leaves → `--info` teal) while preserving every brush stroke's lightness — a colour change only, the line art is never redrawn. It then writes `public/images/brand/sarasvi-mark.png` (header/footer), `favicon.png`, `favicon-192.png`, `apple-touch-icon.png`, `logo-512.png` (schema logo) and `og-image.jpg` (the full lockup on the site's own `--bg`). The hand-authored `public/favicon.svg` carries the same three colours.
- **Tagline** — "Wisdom Through Education", used in the footer, JSON-LD `slogan`, the web manifest and the social card.

## Product video

The 10-second product film runs at the top of the Product Tour section
(`src/components/VideoTour.astro`). `npm run video` compresses the master in
`source-media/` into the three files the page actually ships:

| Output | Codec | Size | Role |
| :-- | :-- | :-- | :-- |
| `public/media/sarasvi-tour.webm` | VP9 + Opus, 1260×720 | ~1.5 MB | served first |
| `public/media/sarasvi-tour.mp4` | H.264 + AAC, 1260×720, `+faststart` | ~1.8 MB | fallback where VP9 is unavailable |
| `public/media/sarasvi-tour-poster.webp` | WebP still (0.3 s frame) | ~47 KB | shown before anyone presses play |

The 12.8 MB 1344×768 master stays in `source-media/` so the renditions can be
rebuilt — it is never served to a visitor.

**It does not slow the page down.** The `<video>` ships with `preload="none"`,
no `autoplay`, a poster, and its `<source>` elements held in `data-src`;
`src/scripts/main.js` attaches them on the first play click (the overlay pill or
the hero's "Watch Product Tour" button) and only then turns on native controls.
Someone who never presses play downloads the 47 KB poster and nothing else, and
a viewer downloads only whichever of the two files their browser can play.
Explicit `width`/`height` plus `aspect-ratio` reserve the box, so the section
never shifts. The clip is also exposed as a `VideoObject` in the page JSON-LD.

## Brand film (scroll-scrubbed)

The 20-second brand film — Saraswati, the goddess the platform is named after,
playing the veena above an open book — sits just under the logo marquee
(`src/components/BlessingFilm.astro`, `#film`). It is **not played, it is
seeked**: the scroll position inside the section's runway is mapped onto
`currentTime`, so it runs forward as you scroll down, rewinds as you scroll back
up, and stops dead at both ends. On a real pointer the frame is pinned
(`position:sticky`) inside a `260svh` runway, which gives the film roughly 1.6
screen-heights of travel. `npm run film` rebuilds everything it needs from the
10.1 MB Gemini master:

| Output | Codec | Size | Role |
| :-- | :-- | :-- | :-- |
| `public/media/sarasvi-blessing.mp4` | H.264 + AAC, 1280×720, `+faststart` | ~3.2 MB | the film itself, for both scrubbing *and* playback |
| `public/media/sarasvi-blessing-p1…p4.webp` | WebP stills | 27–46 KB each | what you scrub on touch screens, and what covers the first decode |
| `public/media/sarasvi-blessing-bg.webp` | 160px blurred still | ~0.4 KB | painted behind the frame so the letterbox picks up the film's palette |

**Why this encode looks different from the tour's.** Scrubbing asks the decoder
for a random frame dozens of times a second, which only stays smooth if
keyframes are dense, so the file keeps one every 4 frames (`-g 4 -sc_threshold 0`,
120 of them) instead of every 2 seconds. The size that costs is paid back with
CRF 34 plus a light denoise — the master is a grainy diffusion render and grain
is the most expensive thing you can hand an encoder. VP9/WebM and 12 fps
encodings were measured and rejected: at equal keyframe density WebM came out
~3× larger, and 12 fps cost *more* bytes while looking worse.

**It still costs a visitor almost nothing.** The section is warmed up by an
`IntersectionObserver` only when it comes within two viewports, and the video is
only ever fetched where it can actually be scrubbed:

| Visitor | Downloads |
| :-- | :-- |
| Never scrolls this far | one 27 KB still |
| On a phone / tablet (no fine pointer) | the four stills — the frame cross-fades them with the scroll and **no video byte moves** |
| `prefers-reduced-motion` | the still only; the film holds its first frame |
| Desktop, scrolls through | the 3.2 MB film, progressively, then scrubs it |
| Presses “Watch with sound” | the same bytes again from cache, in a lightbox with native controls |

One file serves both the scrub and the soundtrack, `width`/`height` +
`aspect-ratio` + a fixed runway height mean the page never shifts, and if the
browser refuses to pin the stage (or JS is off) `main.js`/CSS fall back to the
un-pinned layout rather than leaving a screen of empty space. The film is also
exposed as a second `VideoObject` in the page JSON-LD.

## Spacing system

The vertical rhythm comes from a single set of tokens in `global.css`, so every
section lines up without per-component overrides:

| Token | Default | Use |
| :-- | :-- | :-- |
| `--header-h` | `76px` (`64px` ≤480px) | Fixed header height; also drives the hero offset, anchor scroll-margin and menu height |
| `--pad-x` | `clamp(18px, 4vw, 28px)` | `.container` side padding |
| `--sp-section` | `clamp(64px, 8vw, 96px)` | Vertical padding of a `.section` |
| `--sp-block` | `clamp(40px, 5vw, 60px)` | Every stacked block inside a section (via `.section > * + *`) |
| `--sp-stack` | `clamp(56px, 7vw, 88px)` | Between repeated blocks (`.split + .split`) |
| `--gap-card` / `--gap-lg` / `--pad-card` | `24px` / `clamp(28px, 4.5vw, 64px)` / `clamp(24px, 3vw, 32px)` | Card grids, two-column gaps, card padding |

Components carry no inline `margin-top`/`padding` overrides — add a block to a
section and it inherits the rhythm. The footer (`.foot-grid`, `.foot-news`,
`.foot-bar`) is built on the same tokens.

## SEO included

Unique title/description, canonical, robots meta, Open Graph + Twitter cards, JSON-LD (Organization, WebSite, SoftwareApplication, two VideoObjects, FAQPage), sitemap + robots.txt, semantic landmarks and a single `h1`, WebP images with width/height + lazy loading, preloaded hero image, self-hosted fonts, tiny JS, a compressed click-to-play product video and a scroll-scrubbed brand film (see below).

`legacy/` holds the original single-file HTML build (kept for reference).
