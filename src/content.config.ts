import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';

/**
 * Blog content collection.
 * Each post is a Markdown/MDX file in `src/content/blog/`.
 * Slugs are derived from filename. Draft posts (`draft: true`) are excluded from prod.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('AEO Listings'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
