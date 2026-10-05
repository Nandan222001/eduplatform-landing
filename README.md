# EduPlatform — Marketing Site (Astro)

Static, SEO-optimised landing page for **EduPlatform**, built with [Astro](https://astro.build).

## Commands

| Command | Action |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run images` | Re-optimise `source-images/*.jpg` → `public/images/*.webp` |

## Configuration (`.env`, see `.env.example`)

- `SITE_URL` – production URL (canonical, sitemap, robots, Open Graph). **Set this before deploying.**
- `PUBLIC_FORM_ENDPOINT` – JSON POST endpoint for the demo-request and newsletter forms (Formspree, Getform, your API…). Without it, forms fall back to a prefilled `mailto:`.
- `PUBLIC_CONTACT_EMAIL` – mailbox shown in the footer / used for the fallback.

## SEO included

Unique title/description, canonical, robots meta, Open Graph + Twitter cards, JSON-LD (Organization, WebSite, SoftwareApplication, FAQPage), sitemap + robots.txt, semantic landmarks and a single `h1`, WebP images with width/height + lazy loading, preloaded hero image, self-hosted fonts, tiny JS.

`legacy/` holds the original single-file HTML build (kept for reference).
