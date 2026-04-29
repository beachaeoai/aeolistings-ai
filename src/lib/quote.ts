/**
 * Helpers for rendering quote pages.
 *
 * Quote data lives in `src/content/quotes/*.md` with the schema defined in
 * `src/content.config.ts`. These helpers compute totals and format currency
 * so the Astro page stays declarative.
 */

export interface QuoteLineItem {
  name: string;
  description: string;
  price: number;
  regularPrice?: number;
  note?: string;
  optional: boolean;
}

export interface QuoteDiscount {
  label: string;
  amount: number;
}

/** US dollars. Whole-dollar quotes look more confident than $7,499.99. */
const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function formatUSD(n: number): string {
  return usd.format(n);
}

export function sumPrices(items: QuoteLineItem[]): number {
  return items.reduce((acc, i) => acc + i.price, 0);
}

/** Subtotal = all required (non-optional) items only. */
export function requiredSubtotal(items: QuoteLineItem[]): number {
  return items.filter((i) => !i.optional).reduce((acc, i) => acc + i.price, 0);
}

/** Subtotal of optional add-ons — shown separately, never auto-summed in. */
export function optionalSubtotal(items: QuoteLineItem[]): number {
  return items.filter((i) => i.optional).reduce((acc, i) => acc + i.price, 0);
}

export interface QuoteTotals {
  oneTimeSubtotal: number;
  oneTimeDiscount: number;
  oneTimeTotal: number;
  recurringSubtotal: number;
  recurringOptional: number;
}

export function computeTotals(
  oneTime: QuoteLineItem[],
  recurring: QuoteLineItem[],
  discount?: QuoteDiscount,
): QuoteTotals {
  const oneTimeSubtotal = requiredSubtotal(oneTime);
  const oneTimeDiscount = discount?.amount ?? 0;
  return {
    oneTimeSubtotal,
    oneTimeDiscount,
    oneTimeTotal: oneTimeSubtotal - oneTimeDiscount,
    recurringSubtotal: requiredSubtotal(recurring),
    recurringOptional: optionalSubtotal(recurring),
  };
}

/**
 * Long-form date for the hero block.
 *
 * UTC timezone is forced so a frontmatter date written as `2026-04-29`
 * (which Zod parses as 2026-04-29T00:00:00Z) renders as "April 29, 2026"
 * in every locale instead of shifting to "April 28" in US timezones.
 */
export const dateFmt = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});
