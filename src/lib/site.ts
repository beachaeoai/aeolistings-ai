/**
 * Single source of truth for site-wide metadata.
 * Placeholders marked [PLACEHOLDER] — swap when real info is provided.
 */
export const site = {
  name: 'AEO Listings', // [PLACEHOLDER] — confirm agency name
  domain: 'aeolistings.ai',
  url: 'https://aeolistings.ai',
  tagline: 'Answer Engine Optimization for businesses that want to be the answer.',
  description:
    'AEO Listings is an Answer Engine Optimization agency. We make your business the canonical answer that ChatGPT, Claude, Perplexity, and Google AI return when prospects ask.',
  email: 'hello@aeolistings.ai', // [PLACEHOLDER]
  location: 'United States', // [PLACEHOLDER] — city/state for local schema
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
