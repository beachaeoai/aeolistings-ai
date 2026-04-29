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

/**
 * Quote / estimate collection.
 *
 * Each quote is a Markdown file in `src/content/quotes/`. The frontmatter
 * carries the structured pricing data; the optional body is a free-form
 * scope/notes section rendered above the line items.
 *
 * Quote pages are noindexed and excluded from the sitemap (see
 * astro.config.mjs). Slug = filename. To make URLs hard to guess, append
 * a random token to the filename, e.g. `stag-electric-arizona-x7k2m.md`.
 */
const lineItem = z.object({
  /** Stable identifier — used for toggle state and accept payload. */
  id: z.string(),
  /** Short title for the line — shows in the table. */
  name: z.string(),
  /** 1–3 sentence plain-English description of what's included. */
  description: z.string(),
  /** Price in whole dollars. */
  price: z.number(),
  /** Optional struck-through "regular price" for value framing. */
  regularPrice: z.number().optional(),
  /** Inline note shown beneath the line — e.g. "Discounted from $1,500 standard." */
  note: z.string().optional(),
  /**
   * If true, the client can toggle this item in/out of their scope using
   * a checkbox. If false (default), the item is always included.
   */
  togglable: z.boolean().default(false),
  /**
   * Items that share a `toggleGroup` are toggled together. E.g. social
   * setup and social management both belong to the "social" group, so
   * unchecking either unchecks both.
   */
  toggleGroup: z.string().optional(),
  /** Whether the item is checked by default when the page loads. */
  defaultIncluded: z.boolean().default(true),
});

const quotes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/quotes' }),
  schema: z.object({
    /** Internal reference, e.g. "AEO-2026-001". Shown in hero + emails. */
    quoteId: z.string(),
    client: z.object({
      business: z.string(),
      contact: z.string().optional(),
      domain: z.string().optional(),
    }),
    preparedBy: z.string().default('Jake Beach'),
    preparedOn: z.coerce.date(),
    validUntil: z.coerce.date(),
    /** Optional 1–2 sentence intro shown under the hero. */
    summary: z.string().optional(),
    oneTime: z.array(lineItem).default([]),
    /**
     * Discount applied to the one-time subtotal. Shown as its own line
     * between subtotal and total. Provide exactly one of `percent` or
     * `amount`. Use `percent` (e.g. 25 for 25%) if you want the dollar
     * value to scale when the client toggles services on/off; use
     * `amount` for a flat-dollar discount that stays constant.
     */
    oneTimeDiscount: z
      .object({
        label: z.string(),
        percent: z.number().optional(),
        amount: z.number().optional(),
      })
      .optional(),
    recurring: z.array(lineItem).default([]),
    terms: z.array(z.string()).default([]),
    /** If true, the page bypasses noindex (rare — default keeps it private). */
    indexable: z.boolean().default(false),
  }),
});

export const collections = { blog, quotes };
