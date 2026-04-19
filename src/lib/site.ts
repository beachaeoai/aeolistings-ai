/**
 * Single source of truth for site-wide metadata.
 * Placeholders marked [PLACEHOLDER] — swap when real info is provided.
 *
 * Positioning (locked 2026-04):
 *   Buyer  — local home service pros (contractors, HVAC, roofers, plumbers,
 *            electricians, landscapers, general contractors); also local
 *            professionals (dentists, CPAs, attorneys).
 *   Region — Arizona + Southern Utah. Anchor cities: Mesa, Phoenix, St. George.
 *   Voice  — editorial; plain language; leads with the buyer's problem.
 */
export const site = {
  name: 'AEO Listings',
  domain: 'aeolistings.ai',
  url: 'https://aeolistings.ai',
  tagline:
    'When your next customer asks an AI chatbot for a recommendation, we make sure your business is the answer.',
  description:
    'AEO Listings is an Answer Engine Optimization agency for home service pros and local professionals across Arizona and Southern Utah. We make your business the name ChatGPT, Google AI, Perplexity, and Claude say back when a prospect asks.',
  // Cities in the service region — used in copy, schema, and location pages.
  region: {
    primary: 'Arizona',
    secondary: 'Southern Utah',
    cities: ['Phoenix', 'Mesa', 'Scottsdale', 'Tucson', 'St. George', 'Cedar City'] as const,
  },
  email: 'hello@aeolistings.ai', // [PLACEHOLDER] — set up real inbox via Cloudflare Email Routing or Google Workspace
  location: 'Phoenix, Arizona', // City used in Organization schema.
  founder: {
    name: 'Founder Name', // [PLACEHOLDER]
    title: 'Founder',
  },
  social: {
    // [PLACEHOLDER] — drop full URLs or leave empty strings to hide
    linkedin: '',
    x: '',
    github: '',
  },
  nav: [
    { label: 'Services', href: '/services' },
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
} as const;

export type Site = typeof site;
