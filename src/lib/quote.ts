/**
 * Helpers for rendering quote pages.
 *
 * Quote data lives in `src/content/quotes/*.md` with the schema defined in
 * `src/content.config.ts`. These helpers compute totals and format currency
 * so the Astro page stays declarative.
 *
 * Totals here represent the *default* state when the page loads — the
 * client-side toggle script in the page recomputes these in the browser
 * when the recipient checks/unchecks togglable line items.
 */

export interface QuoteLineItem {
  id: string;
  name: string;
  description: string;
  price: number;
  regularPrice?: number;
  note?: string;
  togglable: boolean;
  toggleGroup?: string;
  defaultIncluded: boolean;
}

export interface QuoteDiscount {
  label: string;
  /** Percent off the subtotal (e.g. 25 for 25%). Mutually exclusive with `amount`. */
  percent?: number;
  /** Flat-dollar discount. Mutually exclusive with `percent`. */
  amount?: number;
}

/**
 * Resolve a discount to a concrete dollar amount given the current subtotal.
 * Percent discounts are computed against the live subtotal so the dollar
 * value scales when the client toggles items on/off; flat amounts stay constant.
 * Result is rounded to the nearest whole dollar.
 */
export function resolveDiscount(
  discount: QuoteDiscount | undefined,
  subtotal: number,
): number {
  if (!discount) return 0;
  if (typeof discount.percent === 'number') {
    return Math.round((subtotal * discount.percent) / 100);
  }
  if (typeof discount.amount === 'number') {
    return discount.amount;
  }
  return 0;
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

/**
 * An item is "included by default" when it's either non-togglable
 * (always included) or togglable + defaultIncluded:true. The page
 * loads with these items checked.
 */
export function defaultIncluded(item: QuoteLineItem): boolean {
  return !item.togglable || item.defaultIncluded;
}

export function defaultSubtotal(items: QuoteLineItem[]): number {
  return items
    .filter(defaultIncluded)
    .reduce((acc, i) => acc + i.price, 0);
}

export interface QuoteTotals {
  oneTimeSubtotal: number;
  oneTimeDiscount: number;
  oneTimeTotal: number;
  recurringSubtotal: number;
}

export function computeTotals(
  oneTime: QuoteLineItem[],
  recurring: QuoteLineItem[],
  discount?: QuoteDiscount,
): QuoteTotals {
  const oneTimeSubtotal = defaultSubtotal(oneTime);
  const oneTimeDiscount = resolveDiscount(discount, oneTimeSubtotal);
  return {
    oneTimeSubtotal,
    oneTimeDiscount,
    oneTimeTotal: oneTimeSubtotal - oneTimeDiscount,
    recurringSubtotal: defaultSubtotal(recurring),
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

/** Compact ISO-style date used in the footer. */
export const dateFmtCompact = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});
