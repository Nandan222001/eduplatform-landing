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
extra tokens exist purely for the Sarasvi lockup, so the mark keeps the colours
of the supplied artwork:

| Token | Value | Use |
| :-- | :-- | :-- |
| `--cream` | `#FBF6EE` | Round badge behind the emblem (header + footer) |
| `--brand-gold` | `#CBA956` | The "i" in the wordmark |

- **Typeface** — headings: Garamond Premier (web substitute: [EB Garamond](https://fonts.google.com/specimen/EB+Garamond)); body: [Open Sans](https://fonts.google.com/specimen/Open+Sans), both per the brand board. Self-hosted via `@fontsource-variable`, so there are no external font requests. The CSS product mockups keep the body face so they still read as software.
- **Wordmark** — the header/footer lockup is the round emblem badge plus "Sarasv" in ink with a gold "i". The brand board's own navy/gold/green is used *only* inside the mark and the generated icons; it is not applied to the page theme.
- **Mark** — `npm run brand` crops the emblem from `source-images/brand/sarasvi-lockup-cream.png` and repaints the artwork backdrop to the badge cream. (Keying it to transparency is not possible: the backdrop, the book pages and the halo highlights are all the same near-white, so cutting the background punches holes in the emblem.) It then writes `public/images/brand/sarasvi-mark.png` (header/footer), `favicon.svg`, `favicon.png`, `favicon-192.png`, `apple-touch-icon.png`, `logo-512.png` (schema logo) and `og-image.jpg` (the full lockup on the site's own `--bg`).
- **Tagline** — "Wisdom Through Education", used in the footer, JSON-LD `slogan`, the web manifest and the social card.

## SEO included

Unique title/description, canonical, robots meta, Open Graph + Twitter cards, JSON-LD (Organization, WebSite, SoftwareApplication, FAQPage), sitemap + robots.txt, semantic landmarks and a single `h1`, WebP images with width/height + lazy loading, preloaded hero image, self-hosted fonts, tiny JS.

`legacy/` holds the original single-file HTML build (kept for reference).
