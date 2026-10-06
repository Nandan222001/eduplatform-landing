import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Set SITE to the production URL (used for canonical URLs, sitemap and Open Graph tags).
const site = process.env.SITE_URL || 'https://www.sarasvi.in';

export default defineConfig({
  site,
  integrations: [sitemap()],
  compressHTML: true,
  build: { inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: false },
  server: {
    // Hosted preview environments serve the dev server behind a proxy host,
    // which Vite blocks by default.
    allowedHosts: true,
  },
});
