# EduPlatform — Marketing Landing Page

A professional, fully self-contained marketing landing page for **EduPlatform** (EduPortal on Web, EduTrack on Mobile) — the AI-powered, multi-tenant school operating system.

Built on the **Kinetic Scholar** design system: warm coral `#FF7A45`, deep purple `#6C5CE7`, teal `#00CEC9`, gold `#FDCB6E`, cream `#FFF4F0` surfaces, Manrope/Inter typography.

## What's inside

- **4 carousels** — product tour, engagement showcase, testimonials, plus an integrations marquee
- **19 custom images** — 10 cinematic landscape photos, 9 portrait art-directed crops for mobile (`<picture>` sources), served responsively
- **Code-built product screenshots** — pixel-crisp browser/phone mockups (admin console, attendance, exams, AI predictions, leaderboard, Olympics, wellbeing, career)
- **Complete feature coverage** — academics core, AI/ML suite, gamification & Virtual Olympics, wellbeing/SEL, career & college, parent portal, live events, blockchain credentials, mobile app, accessibility/PWA, security & white-labeling
- **Conversion sections** — role cards, pricing tiers (Razorpay), FAQ, launch-offer CTA, trust footer

## Files

| File | Purpose |
| :--- | :--- |
| `index.html` | **Deliverable** — single self-contained page (all images inlined as data URIs). Open in any browser. |
| `template.html` | Editable source template with `{{IMG:name}}` placeholders |
| `build.py` | Inlines images (PIL-optimized JPEGs / SVG fallbacks) into `index.html` |
| `svg_assets.py` | Hand-crafted SVG scene fallbacks |
| `v2/` | Landscape + portrait photography used by the build |
| `images/` | Earlier illustration set (kept for reference) |

## Build

```bash
pip install pillow
python3 build.py   # regenerates index.html from template.html + v2/ images
```

## Responsive behavior

- `≤700px`: portrait art-directed crops, stacked layouts, mobile menu
- `320px → 4K`: fluid `clamp()` type and adaptive grids
- Accessibility: skip link, focus-visible rings, ARIA labels, reduced-motion-friendly CSS
