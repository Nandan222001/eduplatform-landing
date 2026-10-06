# Sarasvi — Marketing Site (Astro)

Static, SEO-optimised landing page for **Sarasvi**, built with [Astro](https://astro.build).

> **Sarasvi — Wisdom Through Education.** AI-powered school operating system:
> web portal (Sarasvi Portal) and mobile apps (Sarasvi Mobile).

## Commands

| Command | Action |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Build for Vercel (`.vercel/output/`: static pages + the `/api/*` functions) |
| `npm run images` | Re-optimise `source-images/*.jpg` → `public/images/*.webp` |
| `npm run video` | Re-encode `source-media/*.mp4` → `public/media/*` (needs ffmpeg on `PATH`, or `FFMPEG_BIN=/path/to/ffmpeg`) |
| `npm run brand` | Rebuild favicons, app icons, header mark and the OG card from `source-images/brand/` |

## Configuration (`.env`, see `.env.example`)

- `SITE_URL` – production URL (canonical, sitemap, robots, Open Graph). **Set this before deploying.**
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` – the backend (below). Server-only; set them in Vercel, never in browser code.
- `IP_HASH_SALT` – any long random string; visitor IPs are hashed with it before being stored.
- `PUBLIC_CONTACT_EMAIL` – mailbox shown in the footer, and the fallback if the backend is unreachable.
- `PUBLIC_GA_ID` – optional Google Analytics 4 ID. Supabase analytics work without it.

## Backend: Supabase (forms + analytics)

Pages are static; two small Vercel functions write to Supabase with the service-role key:

| Endpoint | Writes to | What it does |
| :-- | :-- | :-- |
| `POST /api/submit` (`src/pages/api/submit.ts`) | `form_submissions` | All forms (demo request, newsletter, feedback). Same-origin check, honeypot + time trap, server-side validation, max 5 submissions per IP per 10 min, 2-minute duplicate guard. IPs are stored only as a salted hash. |
| `POST /api/track` (`src/pages/api/track.ts`) | `analytics_events` | Cookieless first-party analytics from `src/components/Analytics.astro`: `page_view`, `cta_click`, `form_submit`, `scroll_depth`, `faq_open`, `video_play`, `outbound_click`, with UTM tags, referrer, device and country. Bots are ignored. Visitors in Europe are only tracked after accepting the banner. |

**Setup (once):**
1. Create a Supabase project. In **SQL Editor**, run `supabase/migrations/20261006000000_init.sql`. It creates the tables with Row Level Security on and no public access, plus report views.
2. In Vercel → Settings → Environment Variables, add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API → `service_role`) and `IP_HASH_SALT`. Redeploy.
3. Optional: enable `pg_cron` and schedule `select public.purge_old_data()` daily (keeps the retention promised in the privacy policy).

**Reading the data:** Supabase → Table Editor → `form_submissions` (leads; change `status` as you follow up) and `analytics_events`, or the ready-made views `report_daily_traffic`, `report_top_pages`, `report_traffic_sources`, `report_leads_by_day`.

If the Supabase variables are missing, `/api/submit` answers 503 and the forms open the visitor's email app instead, so no enquiry is lost; `/api/track` silently does nothing.

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

Unique title/description, canonical, robots meta, Open Graph + Twitter cards, JSON-LD (Organization, WebSite, SoftwareApplication, FAQPage), sitemap + robots.txt, semantic landmarks and a single `h1`, WebP images with width/height + lazy loading, preloaded hero image and fonts, self-hosted Latin-only fonts, inlined CSS, skeleton placeholders while images load, tiny JS, and a compressed click-to-play product video (see below).

`legacy/` holds the original single-file HTML build (kept for reference).
