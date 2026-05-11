import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';

// Aeolistings client intake — Astro + Cloudflare Pages adapter
// Per docs/specs/client-intake-v1.0.md

// We deploy at https://aeolistings.ai/intake/* (Worker Route on the
// marketing site's zone carves out the /intake/* prefix). `base` prefixes
// every Astro route at build time so a request to /intake/c/<token>
// matches src/pages/c/[token].astro.
export default defineConfig({
  site: 'https://aeolistings.ai',
  base: '/intake',
  trailingSlash: 'ignore',
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
      configPath: './wrangler.jsonc',
      experimentalJsonConfig: true,
    },
    imageService: 'compile',
  }),
  integrations: [tailwind()],
  vite: {
    optimizeDeps: {
      exclude: ['@notionhq/client'],
    },
  },
});
