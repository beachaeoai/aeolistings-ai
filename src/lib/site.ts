/**
 * Single source of truth for site-wide metadata.
 * Placeholders marked [PLACEHOLDER] — swap when real info is provided.
 *
 * Positioning (locked 2026-04):
 *   Buyer  — home service pros (contractors, HVAC, roofers, plumbers,
 *            electricians, landscapers, general contractors); also local
 *            professionals (dentists, CPAs, attorneys).
 *   Voice  — editorial; plain language; leads with the buyer's problem.
 */
export const site = {
  name: 'AEO Listings',
  domain: 'aeolistings.ai',
  url: 'https://aeolistings.ai',
  tagline:
    'When your next customer asks an AI chatbot for a recommendation, we make sure your business is the answer.',
  description:
    'AEO Listings is an Answer Engine Optimization agency for home service pros and local professionals. We make your business the name ChatGPT, Google AI, Perplexity, and Claude say back when a prospect asks.',
  email: 'hello@aeolistings.ai', // [PLACEHOLDER] — set up real inbox via Cloudflare Email Routing or Google Workspace
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
