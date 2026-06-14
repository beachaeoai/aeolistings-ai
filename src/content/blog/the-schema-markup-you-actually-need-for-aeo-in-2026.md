---
title: "The Schema.org markup you actually need for AEO in 2026"
description: "Most schema guides list everything you could ship. AEO works differently — a small set of Schema.org types does most of the citation work. Here's the minimum viable set, in the order to deploy it."
pubDate: 2026-06-13
author: "AEO Listings"
tags: ["schema-org", "structured-data", "technical", "tactics"]
---

**For a local service business optimizing for AI citation in 2026, the Schema.org markup that actually moves the needle is a much shorter list than most SEO guides imply. Five entity types do roughly 90% of the work: `LocalBusiness` (or its subtype `ProfessionalService`), `Service`, `FAQPage`, `Review` / `AggregateRating`, and `Person` for the founder. The rest of Schema.org's massive vocabulary is either redundant for local services, unused by LLMs in practice, or actively counterproductive when over-applied. This post is the minimum viable set, in the order to ship it.**

Before we get to the list, two clarifying notes. First: this advice is for local service businesses (home service trades, local professionals). E-commerce, SaaS, publishers, and other contexts have different priorities — most need `Product`, `Article`, `SoftwareApplication`, etc. that we don't address here. Second: schema is necessary but not sufficient. Shipping perfect markup against a thin or contradictory entity won't help; schema works because it makes a strong, consistent entity *legible* to crawlers, not because it manufactures one.

## Why schema matters specifically for AEO

LLMs and the retrieval indexes that feed them rely heavily on structured data to disambiguate entities. When ChatGPT, Claude, or Perplexity decides what your business is, where it operates, and what it does, they're primarily reading:

1. Your Schema.org markup (high-trust, machine-readable)
2. Your Google Business Profile (high-trust, scraped widely)
3. Cross-source corroboration (directories, mentions, reviews)

Schema is the only one of these that you control directly on your own site. It's the cheapest, fastest entity-strength lever available.

## The five-type minimum viable set

### 1. Organization / LocalBusiness / ProfessionalService

The foundation. Every page on your site should ship this entity once (typically in the root `@graph` shipped from your layout), with these fields:

- `@type`: `LocalBusiness` is the broad parent; use a more specific subtype if one fits. `ProfessionalService` for professional services (consultancies, attorneys, accountants). `HomeAndConstructionBusiness` and its subtypes for trades.
- `name`, `url`, `email`, `telephone`
- `address` as a `PostalAddress` with `addressLocality`, `addressRegion`, `addressCountry`
- `areaServed` — an array of geographic entities (City, AdministrativeArea, State, Country) you actually serve
- `description` — one paragraph, 2–3 sentences, matches your tagline
- `knowsAbout` — array of 5–8 topics your business is associated with (for entity-graph signaling)
- `sameAs` — array of URLs to your social profiles, directory listings, Wikipedia/Wikidata if applicable
- `logo` as an `ImageObject` (so it's a proper entity, not just a URL string)

This single block does more for AEO than any other piece of schema you'll ship.

### 2. Service

One per major service you offer. Each on the relevant service page (e.g., `/services/plumbing-repair` ships a `Service` for plumbing repair). Required fields:

- `@type`: `Service`
- `name`: specific service name ("Tankless Water Heater Installation," not "Plumbing")
- `provider`: `{ "@id": "<your org @id>" }` — links the service back to the root Organization without redeclaring it
- `serviceType`: the type/category
- `areaServed`: where this specific service is offered (often the same as your org's, sometimes narrower)
- `description`: 100–150 words, written for retrieval (lead with the answer)

This is the entity LLMs reference when answering "do you do X in [city]?" queries. Without it, you're relying on the body text of the page alone to make the connection.

### 3. FAQPage

If you have a page (or section) of question-answer content, mark it up as `FAQPage` with each Q&A as a `Question` and `Answer` pair. The format:

```json
{
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Do you offer same-day service?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Yes — we offer same-day service for emergency calls received before 2pm. Standard service appointments are typically scheduled within 48 hours."
    }
  }]
}
```

FAQPage markup is currently one of the strongest AI-citation signals available, because it gives LLMs literally pre-formatted question/answer pairs to retrieve. Both your generic FAQ page AND per-city or per-service FAQ blocks should ship this.

### 4. Review / AggregateRating

If you have any reviews you can legitimately surface (Google reviews, BBB, industry-specific platforms), include `AggregateRating` on your Organization entity and individual `Review` entities for the strongest 3–5 testimonials.

Important caveat: don't fabricate reviews, don't reuse Google's reviews without permission (they have specific terms), and don't include only positive ones if the aggregate would be misleading. Schema.org schema must be truthful — Google de-indexes sites that ship false review markup, and AI systems train against the same signal.

Required fields for AggregateRating:

- `ratingValue`: average rating (e.g., 4.8)
- `reviewCount`: total count
- `bestRating` / `worstRating`: usually 5 and 1

For individual `Review` entities: `author` (as `Person`), `reviewRating`, `reviewBody`, `datePublished`.

### 5. Person (founder)

For most local service businesses, the founder or owner is a meaningful entity. Shipping a `Person` entity for them strengthens your overall entity graph because LLMs use the founder-org bidirectional link as a corroboration signal.

Required fields:

- `name`, `jobTitle`
- `description` (the bio that appears on your About page)
- `worksFor`: `{ "@id": "<your org @id>" }`
- `image` as an `ImageObject` for the headshot
- `sameAs`: array including personal LinkedIn (and any other public profiles)

Ship the Person in your site-wide root `@graph`, alongside the Organization. Both entities reference each other via `@id`, which models read as bidirectional confirmation.

## The high-ROI add-ons (ship after the five above)

- **BreadcrumbList** on every non-homepage page — small signal, but cheap and helpful for crawlers.
- **Article** / **BlogPosting** on blog content, with `author` referencing the Person entity and `publisher` referencing the Organization.
- **ContactPage** / **AboutPage** as `@id`-linked sub-pages that reference the Organization by `mainEntity`.
- **Service** entities for each service in your offering, on the relevant pages.

## What to skip

A few Schema.org types we routinely see in "complete" SEO audits that add little or no AEO value for local service businesses:

- **`Place`** — redundant with `LocalBusiness` for service businesses with a physical address.
- **`SiteNavigationElement`** — Google ignores it; LLMs don't read it.
- **`SearchAction`** in your WebSite entity — only helpful if you have a site-search feature LLMs would actually use.
- **`OpeningHoursSpecification`** at the granular level — your Google Business Profile already has this and is the canonical source; duplicating on-site adds maintenance cost without retrieval benefit.

You can technically ship all of these correctly and they won't *hurt* — but they distract from the five that actually matter, and over-marked-up pages sometimes trigger Google's "spammy structured data" warnings.

## The graph pattern (important)

Don't ship five separate `<script type="application/ld+json">` blocks each redeclaring the Organization. Use a single root `@graph` shipped site-wide that contains the Organization, Person, WebSite, and ImageObject entities — then have page-specific schema (`AboutPage`, `Service`, `FAQPage`, etc.) reference those by `@id` rather than redeclaring them.

The benefit: a single source of truth for your entity, no risk of contradiction between pages, and a cleaner graph for LLMs to parse. Our own site uses this pattern; the source is straightforward enough to crib from if you want a template.

## Validation tools

Three free tools to validate your markup:

1. **Google's Rich Results Test** — confirms Google can parse your schema and shows what rich results (if any) it qualifies for.
2. **Schema.org's official validator** at validator.schema.org — strictest of the three; catches issues Google ignores.
3. **JSON-LD Playground** — useful for hand-debugging a graph before shipping.

Ship the five core types, link them by `@id`, validate before going live, and move on. Schema markup is high-leverage but it's also a one-time investment plus quarterly maintenance — not the place to spend ongoing weekly hours.
