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
| `npm run film` | Rebuild the site-wide brand film + its background encode in `public/media/` (same ffmpeg requirement) |
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

## Brand film (the whole site sits on it)

The 20-second brand film — Saraswati, the goddess the platform is named after,
playing the veena above an open book — is the **background of every page**. It is
not played, it is *seeked*: the scroll position of the whole document maps onto
`currentTime`, so it runs forward as you scroll down, rewinds as you scroll back
up, and holds its first and last frame at the two ends. It is never "played", so
there is no player UI, no autoplay policy and no sound — the score lives in the
lightbox.

The loader is `src/components/SiteFilm.astro`, mounted once in
`src/layouts/Layout.astro` (so `/`, `/privacy/` and `/terms/` all get it), and
`npm run film` builds everything it needs from the 10.1 MB Gemini master:

| Output | Codec | Size | Role |
| :-- | :-- | :-- | :-- |
| `public/media/sarasvi-blessing-bg.mp4` | H.264, 1280×720, silent, blurred in the encode, `+faststart` | ~1.1 MB | the site background the scroll scrubs |
| `public/media/sarasvi-blessing.mp4` | H.264 + AAC, sharp, `+faststart` | ~3.2 MB | the film itself, played in the lightbox |
| `public/media/sarasvi-blessing-bg-1…4.webp` | WebP stills cut from the same blurred chain | 9–15 KB each | the mobile background, and the first paint |
| `public/media/sarasvi-blessing-p1.webp` | sharp WebP still | ~27 KB | lightbox poster + JSON-LD `thumbnailUrl` |

**Why this encode looks the way it does.** Scrubbing asks the decoder for a random
frame dozens of times a second, which only stays smooth if keyframes are dense, so
both files keep one every 4 frames (`-g 4 -sc_threshold 0`, 120 of them) with no
B-frames. The sharp file pays for that with CRF 34 + a light denoise (the master is
a grainy diffusion render, and grain is the most expensive thing to hand an
encoder). The background file is **blurred in the encode rather than in CSS** —
it sits behind every word on the site, so it has to be quiet, and a `filter:blur()`
on a full-viewport layer would cost more every frame than the whole video costs
once. Blurring also nearly halves the file. VP9/WebM and 12 fps were measured and
rejected (VP9 came out ~3× larger at equal keyframe density; 12 fps cost more bytes
and looked worse).

**How the page stays readable.** Every section declares how much cream wash it
wants in front of the film with `data-film-wash`, and `main.js` lerps between
section centres as you scroll, so the film is at its most visible behind the hero
and the story section and quiet behind walls of copy:

| Section | Wash | Why |
| :-- | :-- | :-- |
| `#top` (hero) | its own gradient scrim (0.97 → 0) | copy column calm, film reads through on the right |
| `#story` | `0.34` + a pool of light behind the copy | the one deliberate window into the film |
| sections in between | `0.70 – 0.76` | readable body copy, film still visibly moving |
| `.stats-bar`, `#cta` | `0.62` | short, high-contrast text |
| `#faq`, `/privacy/`, `/terms/` | `0.78` | long-form reading |
| footer | `0.86` | opaque on purpose |

That table is not guesswork: `data-film-wash` values were checked by compositing
the wash over **all 120 frames** of the background encode and measuring WCAG
contrast for the text colours that sit on each section (the worst case is the
hero's lead paragraph at 5.07:1 against a 4.5:1 requirement).

**What it costs a visitor.** The `<source>` stays in `data-src` and the video is
only fetched on `load`, so nothing competes with the hero; and on the device
classes where a scroll-driven video is a bad idea it is never fetched at all:

| Visitor | Background |
| :-- | :-- |
| Desktop | the 1.1 MB blurred film, buffered, then scrubbed |
| Phone / tablet / Save-Data / 2G-3G | four stills (~47 KB total) cross-fade with the scroll — no video bytes |
| `prefers-reduced-motion` | the first still, held for the whole visit |

If JS is off, the first still simply stays put. A small dock in the corner shows
film progress as a ring around a pause button (stop the background where it is,
for reading) and a sound button; the story section offers the same “Watch with
sound” button, which opens the sharp, scored film in a lightbox with native
controls — fullscreen, captions and scrubbing for free. The film is exposed as a
second `VideoObject` in the page JSON-LD.

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

Unique title/description, canonical, robots meta, Open Graph + Twitter cards, JSON-LD (Organization, WebSite, SoftwareApplication, two VideoObjects, FAQPage), sitemap + robots.txt, semantic landmarks and a single `h1`, WebP images with width/height + lazy loading, preloaded hero image, self-hosted fonts, tiny JS, a compressed click-to-play product video and a site-wide, scroll-scrubbed brand film (see below).

`legacy/` holds the original single-file HTML build (kept for reference).
