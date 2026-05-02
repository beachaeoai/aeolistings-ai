// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://aeolistings.ai',
  trailingSlash: 'never',

  build: {
    format: 'directory',
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    sitemap({
      // Quote pages are private to the recipient — keep them out of the
      // public sitemap. The pages also ship `noindex` via Base.astro.
      filter: (page) => !page.includes('/quote/'),
    }),
  ],

  adapter: cloudflare(),
});