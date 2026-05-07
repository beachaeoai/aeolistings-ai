---
name: city-page
description: Build unique 600–800 word city pages for a local service business that actually rank and don't read as templated trivia. Use when a client has either no city pages or templated city pages copied from a duplicate scaffold (common failure mode — wrong city in title tags, generic city-trivia content, no neighborhood specificity). Replaces "city as a SEO target" with "city as a useful asset."
---

# City pages — done right, not templated

## When this lands

Two common failure modes:
1. **No city pages.** The site lists 35 cities served but has no per-city URL. Google has no signal to rank for "[service] [city]" queries.
2. **Templated city pages.** The site has /chandler/, /mesa/, /glendale/ — but they're a duplicate scaffold with city-trivia (population, founded, parks). Google's helpful-content updates penalize this pattern, and template artifacts (Mesa page's title still says "Chandler") leak through in production.

The fix isn't more city pages — it's actually-useful ones.

## What a useful city page is, exactly

A useful city page answers: *"What's it actually like to use this service in this city?"* — not *"Here's some Wikipedia trivia about Mesa."*

For a service business, that means content tied to:

- **Neighborhoods specifically served** (Las Sendas, Eastmark, Estrella Mountain Ranch, Anthem) with named lot/build characteristics
- **HOA quirks** — which neighborhoods require HOA approval for the work, typical timelines, common pushback points
- **Climate/local conditions** as they affect the service in *this specific city* (Mesa monsoon vs. Glendale heat-island vs. Scottsdale's stricter design review)
- **Permit office specifics** — how long Chandler's permit office takes vs. Mesa's, what's required
- **Common service variants requested in this city** (more tile in Mesa, more flat in commercial Tempe)
- **Real client examples in that city** with project type and rough scope (no need for full case study)
- **Cost ranges that may differ from elsewhere** (e.g., Scottsdale lots are bigger → bigger jobs → higher ranges)
- **City-specific FAQs** — distinct from sitewide FAQs

## Structure (use exactly this)

```
H1: [Service] in [City], [State]

## [1. Hero paragraph — 60-100 words]
What sets [city] apart for [service] in 1-2 sentences (climate, market quirk, etc.),
followed by what the company brings specifically. Avoid generic "we're proud to serve."

## [2. Service-by-service in this city]
For each core service, 1-2 sentences on how it shows up specifically in [city].
"In Mesa, we do significantly more tile reroofs than shingle — most homes built before
2005 are reaching the 20-25 year underlayment failure window now."

## [3. Neighborhoods we work in]
A real list of 8-15 named neighborhoods/communities, with 1-line context per where useful.
"Las Sendas (HOA requires color-matched tile)", "Eastmark (newer construction, mostly
under warranty)", "Apache Wells (1970s-era, common reroof candidates)."
Include ZIP codes if useful.

## [4. What makes [city] specific]
The substantive content — climate, permitting, HOA culture, lot characteristics, anything
that changes how the service is delivered in this city vs. elsewhere.

## [5. Recent projects in [city]]
3-5 short examples: "Tile reroof — [neighborhood] — 2,400 sqft, 4-day turnaround."
No client names needed; details are the point.

## [6. FAQs specific to [city]]
4-6 city-specific Qs. Permit timing, HOA approval, monsoon-season scheduling,
city-inspector quirks. Each 60-120 words (see faq-rewrite skill).

## [7. Service area within [city]]
ZIP codes, neighborhoods, distance/radius covered.

## [8. Embedded map + NAP block]
Google Maps embed pinned on the city + standard NAP block.
```

Word count target: **600–800 unique words** of body copy. Below 600 reads thin; above 800 starts repeating.

## Internal linking — the often-skipped part

Each city page should link to:
- The 3–5 most relevant service pages (tile, shingle, foam — for a roofer)
- The 2–3 nearest other city pages ("We also serve [Mesa](#) and [Gilbert](#)")
- The cost pillar page for the service in this city if one exists

Service pages should link back to the city pages with descriptive anchor text ("our [tile roof work in Mesa](#)" — not "click here").

## Schema for city pages

City pages get **Service** schema with `areaServed: { "@type": "City", "name": "Mesa" }` referencing the same `LocalBusiness` `@id`. They do *not* get a separate LocalBusiness entity each — that creates duplicate entities for one business. See `schema-rollout` skill for the entity-chaining pattern.

If the page has its own city-specific FAQ block, add `FAQPage` schema *to that page only*, not duplicated across all city pages.

## Title tag and meta

- **Title format:** `[Service] in [City], [State] | [Brand]`
  Example: `Tile Roof Replacement in Mesa, AZ | Eco Roofing Solutions`
- **Meta description:** 150–160 chars including the city + service + a substantive benefit (cost range or timeframe), not "Contact us today!"

## URL slug consistency

Pick one pattern and stick with it across all city pages:
- `/services/tile-roofing/mesa/` — service-first (best for sites with multiple services per city)
- `/locations/mesa/` — location-first (best for single-service businesses)
- `/[city]/` — bare-city (only if the brand is that simple)

If the site has inconsistent slugs (e.g., `/locations-chandler-arizona/` vs `/mesa/` vs `/glendale/`), standardize and 301-redirect the odd ones out. Don't leave inconsistency live.

## Build order — which cities first

Don't build all 35 listed cities at once. Sequence:

1. **Tier 1 (build first):** Cities the business actually does the most work in — usually 4–6 cities. These get full 600–800 word pages.
2. **Tier 2 (build next):** Adjacent cities with real demand. Same template, can be slightly thinner (500–650 words).
3. **Tier 3 (don't build):** Cities listed in the footer but with negligible work. Don't create thin city pages for these — they hurt site quality. Keep them in the footer list only.

## Common failure modes

- **Templated city trivia** (population, founded, parks). Looks like content; reads as nothing.
- **Wrong city in title tag/H3** — duplicate-scaffold artifact. Always grep the file for the previous city's name before publishing.
- **No real neighborhoods.** "We serve all of Mesa" is invisible compared to "Las Sendas, Eastmark, Apache Wells."
- **Generic city-specific FAQs** that aren't actually city-specific.
- **Contact form as the primary CTA without context.** A "Get a Free Estimate" button with no city-tied substance.
- **Thin (under 400 words) — Google reads as low-quality.

## Output format

For a build engagement, deliver per city:
1. **Brief in 1 paragraph** — what makes this city distinct, sourced from real client/project knowledge
2. **The full page draft** in markdown matching the structure above
3. **Title + meta description**
4. **Schema JSON-LD** (Service + optional FAQPage)
5. **Internal-link plan** — which service pages this city links to and which city pages link to this

Build cities in batches of 2–3, not all six at once. Easier to fix a problem before it propagates.

## Related skills

- `faq-rewrite` — for the city-specific FAQ block on each page
- `schema-rollout` — for the schema layer
- `cost-pillar` — cost pillar pages link prominently from city pages
- `case-study` — real projects in the city link out to full case studies
