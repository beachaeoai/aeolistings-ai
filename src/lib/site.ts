/**
 * Single source of truth for site-wide metadata.
 * Placeholders marked [PLACEHOLDER] — swap when real info is provided.
 *
 * Positioning (locked 2026-04, regional+national added 2026-04):
 *   Buyer  — home service pros (contractors, HVAC, roofers, plumbers,
 *            electricians, landscapers, general contractors); also local
 *            professionals (dentists, CPAs, attorneys).
 *   Voice  — editorial; plain language; leads with the buyer's problem.
 *   Geo    — Headquartered Mesa, AZ. Local concentration in the East
 *            Valley + Phoenix metro. Service area: United States.
 *
 * The fields below feed both the visible site and the JSON-LD `@graph`
 * shipped on every page. Schema entities are wired together by `@id`
 * URIs derived from `url`, so any change here propagates to the LLM
 * representation of the agency. Keep entity copy clean and identical to
 * what the same entities say on third-party sites (LinkedIn, directories,
 * etc.) — entity-graph consistency is the largest unforced AEO error.
 */
export const site = {
  name: 'AEO Listings',
  domain: 'aeolistings.ai',
  url: 'https://aeolistings.ai',
  tagline:
    'When your next customer asks an AI chatbot for a recommendation, we make sure your business is the answer.',
  description:
    'AEO Listings is an Answer Engine Optimization agency headquartered in Mesa, Arizona, working with home service pros and local professionals across the United States. We make your business the name ChatGPT, Google AI, Perplexity, and Claude say back when a prospect asks.',
  email: 'hello@aeolistings.ai',
  /**
   * Physical headquarters. Mesa, AZ. Used in PostalAddress on the
   * Organization entity and in the footer. Anchors the local-business
   * entity for "AEO agency in Mesa" / "AEO agency in Phoenix" queries
   * without scoping the service area to AZ-only.
   */
  address: {
    addressLocality: 'Mesa',
    addressRegion: 'AZ',
    addressCountry: 'US',
  },
  /**
   * Geographic positioning shown in copy. Service area is national; local
   * concentration is the East Valley + Phoenix metro. The dual position
   * is deliberate — see /locations for per-city pages.
   */
  geo: {
    city: 'Mesa',
    state: 'Arizona',
    metro: 'Phoenix metropolitan area',
    region: 'East Valley',
    country: 'United States',
    /** Footer + about-page line; one place, one phrasing. */
    label: 'Mesa, Arizona · serving the United States',
  },
  /**
   * Topical-authority signals for entity disambiguation in LLM knowledge graphs.
   * Cheap field, high ROI — models use this to associate the agency with these
   * topics when answering "agencies that do X" questions.
   */
  knowsAbout: [
    'Answer Engine Optimization',
    'Generative Engine Optimization',
    'LLM Search Visibility',
    'AI citation tracking',
    'Schema.org structured data',
    'Local SEO for service businesses',
  ],
  /**
   * Founder identity. Feeds the Person entity in the root JSON-LD graph and
   * the visible founder block on /about. The personal LinkedIn URL goes on
   * the Person entity (Person.sameAs), not on Organization.sameAs — those
   * are different entities and conflating them is an entity-graph error.
   */
  founder: {
    name: 'Jake Beach',
    title: 'Founder',
    /** Personal LinkedIn — Person.sameAs, NOT Organization.sameAs. */
    linkedin: 'https://www.linkedin.com/in/jacobbeach1/',
    /** Path under /public, served at /images/founder.jpg */
    portrait: '/images/founder.jpg',
    /** Native dimensions of the optimized portrait (800×1067 JPEG). */
    portraitWidth: 800,
    portraitHeight: 1067,
    /** Bio used both on /about and in Person.description in schema. */
    bio: "Jake Beach is the founder of AEO Listings LLC, a Mesa-based agency that helps contractors and local service businesses get recommended in AI search, Google, and other answer engines when prospects ask who to hire. He combines real-world marketing and small-business experience with a focus on helping owners grow on their own terms — building simple systems that turn online visibility into the right kind of calls, leads, and booked work.",
  },
  social: {
    // Organization-level URLs only. Personal social profiles live under
    // `founder` above. sameAs is the single highest-ROI schema field for
    // entity disambiguation in LLMs.
    linkedin: 'https://www.linkedin.com/company/aeo-listings-llc/',
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

/**
 * Build the site-wide JSON-LD `@graph` shipped on every page via Base.astro.
 *
 * Verdict (revised 2026-04 with Mesa HQ added): the Organization is typed
 * `['Organization', 'ProfessionalService']`. `ProfessionalService` is a
 * `LocalBusiness` subtype in Schema.org's hierarchy, so adding the
 * `LocalBusiness` type explicitly would be redundant. The PostalAddress
 * (Mesa, AZ) gives us the local-entity grounding LLMs use for "AEO agency
 * in Mesa / Phoenix" queries; `areaServed` as an array (Mesa → Phoenix
 * metro → Arizona → US) preserves the national positioning so we are not
 * scoped out of national prompts. Per-city ProfessionalService entities
 * for the regional pages live in `lib/locations.ts` and reference this
 * root Organization by `@id`.
 */
export function buildRootSchemaGraph(): Record<string, unknown> {
  const orgId = `${site.url}/#org`;
  const websiteId = `${site.url}/#website`;
  const logoId = `${site.url}/#logo`;
  const personId = `${site.url}/#jake`;
  const portraitId = `${site.url}/#jake-portrait`;

  // Organization.sameAs: COMPANY-level URLs only. Personal profiles live
  // on the Person entity below. Mixing them is an entity-graph error LLMs
  // pick up on and demote.
  const orgSameAs = [site.social.linkedin, site.social.x, site.social.github].filter(
    (v) => typeof v === 'string' && v.length > 0,
  );

  // Person.sameAs: personal profile URLs for the founder.
  const personSameAs = [site.founder.linkedin].filter(
    (v) => typeof v === 'string' && v.length > 0,
  );

  const organization: Record<string, unknown> = {
    '@type': ['Organization', 'ProfessionalService'],
    '@id': orgId,
    name: site.name,
    url: `${site.url}/`,
    email: site.email,
    description: site.description,
    slogan: site.tagline,
    knowsAbout: site.knowsAbout,
    serviceType: 'Answer Engine Optimization',
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.address.addressLocality,
      addressRegion: site.address.addressRegion,
      addressCountry: site.address.addressCountry,
    },
    // Dual position: HQ city → regional metro → state → country. LLMs that
    // weight `areaServed` for "agency in [place]" queries see all four.
    areaServed: [
      { '@type': 'City', name: 'Mesa' },
      { '@type': 'AdministrativeArea', name: 'Phoenix metropolitan area' },
      { '@type': 'State', name: 'Arizona' },
      { '@type': 'Country', name: 'United States' },
    ],
    logo: { '@id': logoId },
    image: { '@id': logoId },
    founder: { '@id': personId },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: site.email,
        availableLanguage: ['English'],
        areaServed: 'US',
      },
    ],
  };
  if (orgSameAs.length > 0) organization.sameAs = orgSameAs;

  // Person entity for the founder. Shipped in the root @graph so it appears
  // on every page (consistent entity signal) rather than only /about.
  // The Organization references this Person via `founder: { @id }` above.
  const person: Record<string, unknown> = {
    '@type': 'Person',
    '@id': personId,
    name: site.founder.name,
    jobTitle: site.founder.title,
    description: site.founder.bio,
    worksFor: { '@id': orgId },
    url: `${site.url}/about`,
    image: { '@id': portraitId },
  };
  if (personSameAs.length > 0) person.sameAs = personSameAs;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      person,
      {
        '@type': 'ImageObject',
        '@id': portraitId,
        url: `${site.url}${site.founder.portrait}`,
        width: site.founder.portraitWidth,
        height: site.founder.portraitHeight,
        caption: `${site.founder.name}, ${site.founder.title} of ${site.name}`,
      },
      {
        '@type': 'ImageObject',
        '@id': logoId,
        url: `${site.url}/og/wordmark-paper.png`,
        width: 1850,
        height: 600,
        caption: `${site.name} wordmark`,
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: `${site.url}/`,
        name: site.name,
        description: site.description,
        publisher: { '@id': orgId },
        inLanguage: 'en-US',
      },
    ],
  };
}
