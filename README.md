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

Unique title/description, canonical, robots meta, Open Graph + Twitter cards, JSON-LD (Organization, WebSite, SoftwareApplication, FAQPage), sitemap + robots.txt, semantic landmarks and a single `h1`, WebP images with width/height + lazy loading, preloaded hero image, self-hosted fonts, tiny JS.

`legacy/` holds the original single-file HTML build (kept for reference).
