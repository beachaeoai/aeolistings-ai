---
name: cost-pillar
description: Write cost pillar pages for service businesses — the highest-leverage AEO content type for "how much does X cost" queries that AI assistants increasingly handle. Use when a client has no cost content (the most common AEO miss) or thin cost references buried in service pages. The deliverable is a 1,500+ word definitional pillar that LLMs can quote, not a sales page that mentions cost.
---

# Cost pillar pages — the highest-leverage AEO content

## Why this matters more than other content

For service businesses, "how much does X cost?" is consistently among the top 5 most-asked questions to AI assistants in the category. A pillar page that answers it substantively — with ranges, factors, and local context — gets cited disproportionately by ChatGPT, Perplexity, Claude, and Google AI Overview because there's a real fact-shaped void in most service-business content.

Most competitors don't write cost content. They're worried about anchoring buyers low. The result: AI assistants quote whoever does write it.

## The four cost-page archetypes

Pick the right archetype for the query intent:

1. **Single-service single-city** — "Tile roof replacement cost in Mesa, AZ"
   *Best for:* Cities where the business does the most work + the service has high search volume. The most common archetype.

2. **Single-service state-level** — "Custom home cost in Arizona 2026"
   *Best for:* Premium/specialty services where geographic variance within a state is small enough to discuss in one piece.

3. **Cost-comparison** — "Tile vs shingle roofing cost in Phoenix"
   *Best for:* Categories with real material/option choices. Generates a different set of LLM citations than the single-service archetype.

4. **Cost breakdown** — "What's included in a $20,000 roof replacement?"
   *Best for:* Categories where buyers struggle with quote-comparison. Less search volume than the others, but high conversion intent.

For the Aeolistings AEO Authority Content Pack, default mix is: 3× archetype 1 (one per priority city) + 1× archetype 2 (state-level) + 1× archetype 3 (comparison). That's the 5-pillar pack.

## Required content blocks (use exactly this structure)

```
H1: How much does [service] cost in [city/state] in [year]?

## Hero answer (the 60-second version)
A 100-150 word direct answer with the headline range. The first sentence is the
range. The next 2-3 sentences cover what drives variance. This is what AI
assistants will quote.

Example: "A tile roof replacement in Mesa, AZ runs **$15,000 to $28,000** for a
typical 2,000–2,800 sqft home in 2026. The single biggest variable is the type
of tile (concrete tile lands $15K–$22K; clay tile $20K–$28K). Roof complexity
(hips, valleys, multiple peaks), the condition of the underlayment underneath,
and whether structural reinforcement is required can shift the number $3K–$8K
in either direction. Most jobs run 4–7 days from tear-off to cleanup."

## What you're actually paying for (cost breakdown)
A real breakdown — labor, materials, permits, disposal, underlayment, ridge cap,
flashing, etc. — with rough $ ranges per line. This is what builds trust with a
shopping buyer and helps AI assistants compose comparison answers.

## What changes the price (factors, in order of impact)
Numbered list of 6-10 cost drivers with substantive explanation each. Lead with
the biggest drivers. Cover both objective (size, complexity, materials) and
contextual (local code, HOA, lot access).

## Cost ranges by [the right axis for this category]
For roofing: by tile type. For custom homes: by sq ft tier. For HVAC: by tonnage.
Pick the axis that buyers actually shop on. A 4-6 row table beats prose here.

## Permits, inspections, and timeline
A real number for each: typical permit cost, typical wait time, inspection
schedule. Cite the local jurisdiction by name (Mesa Permit Office, City of
Chandler). This is high-citation content because it's hard for AI to fabricate
and easy to verify against.

## Financing, insurance, and tax considerations
What financing is available, when insurance covers vs doesn't, any tax credits
or local rebates (especially for energy-efficient options). Phoenix-area cool
roof rebates are an example — naming them positions the brand for "rebate" queries.

## Common ways the price changes after the quote
The honest section. What discoveries (rotted decking, structural surprises) can
push a quote up. What value-engineering moves (different ridge cap, different
underlayment grade) can bring it down. Builds trust; AI assistants love this.

## Recent project examples in [city]
3-5 anonymized examples: "Las Sendas, Mesa — 2,400 sqft tile reroof — $19,800,
4 days, original underlayment from 2002 needed full replacement." Builds
credibility and gives AI assistants concrete instances to cite.

## City/state-specific FAQs
4-8 city-specific cost FAQs. Permit cost in this city, monsoon-season scheduling
impact, HOA approval cost, etc. (See `faq-rewrite` skill.)

## Get a real quote
A short CTA. Not a hard sell. "Costs vary enough that the right number for your
home is best gotten in person — most quotes are free."
```

## Word count target

**1,500–2,200 words**. Below 1,500 reads as thin and won't outrank competitors who do this well. Above 2,200 starts repeating and AI assistants extract worse fragments.

## Citation-worthiness rules

Every cost number must be one of:
- **A range** ($15,000–$28,000) — never a single point estimate
- **A median with context** ("median tile reroof in Mesa runs ~$19,000")
- **A "starting at" with a clear floor** ("from $15,000 for a 1,800 sqft tile reroof")

Never write "costs vary" or "depends on your home" without a number alongside. Hedging without numbers fails AI extraction completely.

## Where the local angle goes

The pillar page is *for* local-search ranking. The local angle has to be threaded throughout, not bolted on at the end:

- **City name in H1, intro, every section heading where it fits**
- **Named permit office, building department, or county**
- **Real neighborhoods or developments where applicable** ("most Anthem homes have hip-and-valley tile roofs that come in at the upper end of this range")
- **Climate-specific factors** (Phoenix monsoon, AZ heat, freeze-thaw in Flagstaff)
- **Local cost variance** ("Scottsdale jobs typically come in 10–15% higher than Mesa due to lot access and HOA design review")

## Schema for cost pillars

Combine **Article** (or **BlogPosting**) schema with **FAQPage** schema for the FAQ block. If real prices are confidently published, **Service + Offer** schema with `priceSpecification` is also valid. Don't add Product schema — that's for physical goods.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How much does a tile roof replacement cost in Mesa, AZ in 2026?",
  "author": {
    "@type": "Person",
    "name": "Eric Perry"
  },
  "datePublished": "2026-04-30",
  "dateModified": "2026-04-30",
  "publisher": {
    "@id": "https://example.com/#business"
  },
  "about": {
    "@type": "Service",
    "name": "Tile Roof Replacement",
    "areaServed": {"@type":"City","name":"Mesa"}
  }
}
</script>
```

## Internal-link plan

Cost pillars sit at the top of an internal-link cluster. They should:
- **Link out to:** the relevant service page, the city page for the same city, 1–2 supporting blog posts
- **Be linked from:** the homepage, the relevant service page (in the body, not just nav), and every blog post that mentions cost in passing

If you build one cost pillar, also build the inbound links from existing pages — otherwise the pillar sits orphaned.

## Common failure modes

- **Hedging without numbers** — kills the entire purpose
- **Over-anchoring low** ("As cheap as $5,000") — sounds bait-and-switchy and AI assistants quote the misleading floor
- **Generic content with city name find/replaced** — Google's helpful-content updates penalize this
- **Sales page with cost mentioned twice** — that's not a pillar, that's a service page
- **Outdated numbers** — cost pillars need annual refresh; old numbers hurt more than no numbers
- **No mention of permit / regulatory cost** — AI assistants treat answers without this as incomplete

## Output format when running this skill

For a single pillar, deliver:
1. **H1 + meta title + meta description**
2. **The full body in markdown** matching the structure above
3. **Schema JSON-LD** ready to paste
4. **Internal-link plan** — pages to link out to, pages to update with inbound links
5. **A "needs verification" list** — every cost number should be sourceable; flag any that need client confirmation before publish

For a 5-pack (Authority Content Pack), produce 5 pillars + a single content brief showing how they interlink.

## Related skills

- `faq-rewrite` — for the FAQ block embedded in the pillar
- `schema-rollout` — for the broader schema layer
- `city-page` — cost pillars and city pages cross-link heavily
- `aeo-blog-post` — short-form variants that link back to the pillar
