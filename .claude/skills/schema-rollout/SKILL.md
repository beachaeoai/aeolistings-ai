---
name: schema-rollout
description: Implement structured-data markup (LocalBusiness, FAQPage, Service, Organization, BreadcrumbList) across a service business website. Use when a client's site has no schema confirmed in fetched output and AEO/local-search performance depends on machine-extractable entity facts. Includes ready-to-paste JSON-LD templates with conditional fields, sameAs disambiguation, and verification workflow.
---

# Schema rollout — structured data for AEO + local SEO

## When this lands

A client's site renders fine for humans but produces nothing for AI assistants and Google's structured data parsers. Common signals: no schema confirmed in WebFetch output, no rich results in search, no entity Knowledge Graph panel for the brand.

## What goes where

| Schema type | Where to install | Why |
|---|---|---|
| `LocalBusiness` (or sub-type) | Sitewide via header/footer template | Confirms entity facts (NAP, hours, area served) |
| `Organization` | Homepage only | Establishes brand identity, `sameAs` disambiguation |
| `FAQPage` | Each page that has FAQ content | Drives AI Overview citations + rich results |
| `Service` | Each dedicated service page | Connects services to the entity |
| `BreadcrumbList` | Sitewide on non-homepage | Improves SERP display + AI navigation |
| `Review` / `AggregateRating` | Wherever real reviews are embedded | **Only with verifiable reviews** — Google penalizes fake |
| `Article` / `BlogPosting` | Each blog post | Author bylines + publication dates for E-E-A-T |
| `Product` (selectively) | Service pages with clear "starting at" pricing | Optional but useful for AI summaries |

**Pick the most specific LocalBusiness sub-type that exists.** `RoofingContractor`, `Electrician`, `Plumber`, `HVACBusiness`, `HomeAndConstructionBusiness`, `GeneralContractor`. Don't fall back to generic `LocalBusiness` if a sub-type fits — specificity is a ranking signal.

## LocalBusiness template (sitewide)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "RoofingContractor",
  "@id": "https://example.com/#business",
  "name": "Eco Roofing Solutions",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "image": "https://example.com/storefront.jpg",
  "telephone": "+1-480-695-7736",
  "email": "info@example.com",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "75 W Baseline Suite 19",
    "addressLocality": "Gilbert",
    "addressRegion": "AZ",
    "postalCode": "85233",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "33.3781",
    "longitude": "-111.7894"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
      "opens": "08:00",
      "closes": "17:00"
    }
  ],
  "areaServed": [
    {"@type":"City","name":"Mesa"},
    {"@type":"City","name":"Gilbert"},
    {"@type":"City","name":"Chandler"},
    {"@type":"City","name":"Scottsdale"},
    {"@type":"City","name":"Tempe"},
    {"@type":"City","name":"Queen Creek"}
  ],
  "founder": {
    "@type": "Person",
    "name": "Eric Perry"
  },
  "foundingDate": "2000",
  "identifier": {
    "@type": "PropertyValue",
    "propertyID": "AZ ROC License",
    "value": "ROC#XXXXXX"
  },
  "sameAs": [
    "https://www.google.com/maps/place/...",
    "https://www.facebook.com/...",
    "https://www.instagram.com/...",
    "https://www.bbb.org/us/az/...",
    "https://www.houzz.com/professionals/..."
  ]
}
</script>
```

## FAQPage template (per page with FAQs)

Use citation-worthy answers (see `faq-rewrite` skill). Match exact text on page.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does a tile roof replacement cost in Mesa, AZ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A tile roof replacement on a typical Mesa home runs $15,000–$28,000..."
      }
    }
  ]
}
</script>
```

## Service template (per service page)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Tile Roof Replacement",
  "provider": {
    "@id": "https://example.com/#business"
  },
  "areaServed": [
    {"@type":"City","name":"Mesa"},
    {"@type":"City","name":"Gilbert"}
  ],
  "description": "Full tile roof replacement including underlayment...",
  "offers": {
    "@type": "Offer",
    "priceSpecification": {
      "@type": "PriceSpecification",
      "priceCurrency": "USD",
      "minPrice": 15000,
      "maxPrice": 28000
    }
  }
}
</script>
```

The `@id` reference (`#business`) chains the service back to the LocalBusiness entity — important for entity graph consistency.

## Organization with sameAs (disambiguation)

When two similarly-named entities exist (e.g., `cruzdevaz.com` vs `cruzcruzdevelopment.com`), explicit `sameAs` arrays tell search engines which set of off-platform identities belong together. Critical for name-collision cases.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://cruzdevaz.com/#org",
  "name": "Cruz Development",
  "url": "https://cruzdevaz.com",
  "sameAs": [
    "https://www.google.com/maps/place/...",
    "https://www.houzz.com/professionals/...pf~30544835",
    "https://www.instagram.com/cruzdevaz/",
    "https://www.bradleavitt.com/podcast/matthew-gallego"
  ]
}
</script>
```

## Implementation workflow

1. **Audit existing schema** — run the page through Google's Rich Results Test (`https://search.google.com/test/rich-results`) and Schema.org validator. Don't claim "no schema" without verifying.
2. **Confirm NAP across surfaces first** — schema is only as good as the underlying facts. If GBP says one address and the website says another, fix that *before* writing schema.
3. **Pick LocalBusiness sub-type** — most specific available.
4. **Install LocalBusiness sitewide via template/layout component**, not page-by-page (avoids drift).
5. **Add Organization + sameAs on homepage** for entity disambiguation.
6. **Per-page schema** (FAQPage, Service, Article) goes in the page template for that route.
7. **Test every page** after rollout — Rich Results Test, Schema validator, manual Google "Inspect URL" check in Search Console.
8. **Resubmit sitemap** — schema changes are picked up faster after a sitemap resubmission.
9. **Monitor for ~30 days** — rich results / Knowledge Panel changes appear within 2–6 weeks.

## Pitfalls

- **Don't fake reviews.** AggregateRating with no real Review markup is detected and penalized. Either skip rating schema or pull real reviews into `Review` objects with reviewer names.
- **Don't duplicate FAQPage** on multiple pages. Google picks one and ignores the rest.
- **Don't list cities you don't actually serve** in `areaServed` — Google cross-references with GBP service area.
- **Don't use generic LocalBusiness when a sub-type fits** — specificity matters.
- **Don't add Service schema to a page that's not a real service page.** A blog post about tile roofing isn't a Service offering.

## Output format

Produce:
1. **The schema audit findings** (what's there now, what's missing)
2. **Each JSON-LD block** ready to paste, with a comment indicating the page/template it goes in
3. **A verification checklist** — pages to test, what to confirm in Rich Results Test
4. **A rollout plan** — sitewide first, then per-template, then per-page

## Related skills

- `faq-rewrite` — produces the FAQ content the FAQPage schema marks up
- `gbp-optimize` — ensures NAP consistency between GBP and schema
- `trust-signals` — sources real reviews that can legitimately be schema-marked
