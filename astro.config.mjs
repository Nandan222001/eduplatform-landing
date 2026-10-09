import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// Security headers for every response. With the Vercel adapter the deploy uses the
// generated .vercel/output/config.json (vercel.json headers are not applied), so
// they are prepended to its routes after the build.
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': 'upgrade-insecure-requests',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
const securityHeaders = {
  name: 'sarasvi-security-headers',
  hooks: {
    'astro:build:done': () => {
      const file = '.vercel/output/config.json';
      if (!existsSync(file)) return;
      const cfg = JSON.parse(readFileSync(file, 'utf8'));
      cfg.routes = [{ src: '^/.*$', headers: SECURITY_HEADERS, continue: true },
        ...cfg.routes.filter((r) => !(r.headers && r.headers['Strict-Transport-Security']))];
      writeFileSync(file, JSON.stringify(cfg, null, 2));
    },
  },
};

// The production URL, used for canonical links, sitemap, robots.txt and the share
// (Open Graph) image. SITE_URL wins; otherwise Vercel's own production domain
// (VERCEL_PROJECT_PRODUCTION_URL, set automatically at build time), so share
// previews never point at a domain that isn't live.
const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL || (vercelDomain ? `https://${vercelDomain}` : 'https://sarasvi.nmtsolution.com');

export default defineConfig({
  site,
  // Pages stay static (prerendered); only src/pages/api/* run as Vercel functions.
  output: 'static',
  adapter: vercel(),
  integrations: [
    securityHeaders,
    sitemap({ filter: (page) => !/\/(404|thank-you|admin|api\/.*)\/?$/.test(page) }),
  ],
  compressHTML: true,
  // CSS is small once compressed; inlining it removes the render-blocking request.
  build: { inlineStylesheets: 'always' },
  prefetch: { prefetchAll: false },
  server: {
    // Hosted preview environments serve the dev server behind a proxy host,
    // which Vite blocks by default.
    allowedHosts: true,
  },
});
