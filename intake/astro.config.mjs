import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';

// Aeolistings client intake — Astro + Cloudflare Pages adapter
// Per docs/specs/client-intake-v1.0.md

export default defineConfig({
  site: 'https://intake.aeolistings.ai',
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
      configPath: './wrangler.toml',
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
