import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Set SITE to the production URL (used for canonical URLs, sitemap and Open Graph tags).
const site = process.env.SITE_URL || 'https://eduplatform.example';

export default defineConfig({
  site,
  integrations: [sitemap()],
  compressHTML: true,
  build: { inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: false },
});
