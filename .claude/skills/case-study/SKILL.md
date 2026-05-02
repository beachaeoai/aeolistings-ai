---
name: case-study
description: Write a project case study for a service business — specific enough to build trust, structured enough to rank, schema-marked to be cited by AI. Use when a client has thin portfolio content (e.g., "Project Title / Excerpt here" placeholders) or is expanding from 2 published projects to 8–12 (the typical audit recommendation).
---

# Case studies — built for trust, ranking, and AI citation

## When this lands

The audit found one of:
- Placeholder portfolio cards live in production
- 1–3 published projects when 8–12 is competitive in the category
- Generic "we built this beautiful home" prose without specifics
- No location, scope, timeline, or budget context per project

## What a real case study contains

A real case study has six required sections plus 2 optional:

```
H1: [Service] in [Neighborhood], [City] — [Distinctive detail]
Example: "Tile Reroof in Las Sendas, Mesa — 2,400 sqft, 4-day turnaround"

## At-a-glance (the citation block)
A 4-row data table:
- Location: Las Sendas, Mesa, AZ
- Scope: Full tile reroof + underlayment replacement
- Size: 2,400 sqft
- Timeline: 4 days
- Year: 2025
- Budget: $19,500–$22,000 range (or actual if client agreed)

## The situation (60–100 words)
What the client was dealing with. Specific. Original tile from 2002, two leaks
detected during monsoon, HOA color-match requirement, owner planning to sell
within 2 years and wanted longevity not aesthetic upgrade.

## What we did (150–250 words)
Step-by-step what the work involved. Materials chosen and why. Decisions made
along the way. This is the section AI assistants pull from for "what does X
involve" queries. Specific over poetic.

## Challenges and how we handled them (100–150 words)
The real ones — supply-chain delay, weather, structural surprise, HOA approval
delay. Honest. Builds more trust than "everything went perfectly."

## Outcome (60–100 words)
Hard outcomes: roof passed inspection, 25-year warranty active, client referred
us to neighbor. Use real numbers when possible.

## Optional: client testimonial (verbatim, attributed)
Only if you have a real quote with permission to publish. Don't fabricate.

## Optional: photo gallery (3–8 photos)
Before, during, after — with caption per photo. Geotag if possible.
```

## Word count and format

- **Total: 600–1,000 words**
- The at-a-glance data block is non-negotiable — that's what AI assistants quote
- Use H2/H3 structure consistently (helps AI parse)

## Schema for case studies

Use **Article** schema with `about` referencing a `Service`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Tile Reroof in Las Sendas, Mesa — 2,400 sqft, 4-day turnaround",
  "datePublished": "2025-09-15",
  "author": {"@type":"Person","name":"Eric Perry"},
  "publisher": {"@id": "https://example.com/#business"},
  "about": {
    "@type": "Service",
    "name": "Tile Roof Replacement",
    "areaServed": {"@type":"City","name":"Mesa"}
  }
}
</script>
```

If photos are embedded, add `image` array. If a real testimonial appears, embed `Review` schema separately.

## URL slug pattern

`/portfolio/[neighborhood]-[service-type]/`
or
`/projects/[city]/[service-and-detail]/`

Pick one and stick with it. Examples:
- `/portfolio/las-sendas-tile-reroof/`
- `/projects/mesa/anthem-shingle-replacement/`

## Internal-link plan

Each case study should link to:
- The relevant service page
- The city page where the project happened
- The cost pillar for the service in that city (if exists)
- 1–2 other case studies (similar project type or similar neighborhood)

The service page and city page should link back to relevant case studies in the body, not just a footer "see all projects" link.

## Build order — which to write first

When expanding from 2 to 8–12 projects, sequence:

1. **Most distinctive recent projects first** — projects with photos, real client permission, named neighborhoods, and notable details
2. **Geographic spread next** — make sure each priority city has at least one project
3. **Service-type spread** — make sure each major service has at least one project
4. **Don't pad with thin "we did a job" entries** — better to have 8 strong than 12 mediocre

## Common failure modes

- **No real numbers** ("about average size", "took some time")
- **Too poetic** — "We crafted this dream home with love and care"
- **Missing the at-a-glance block** — kills AI citation
- **Stock-photo galleries** — defeats the purpose
- **No client permission for names** — anonymize ("a Mesa homeowner") rather than skip the project
- **Aspirational claims** — "industry-best" anything

## Output format

For a case study commission, deliver:
1. **The full case study in markdown** matching the structure
2. **Article schema JSON-LD**
3. **Suggested URL slug**
4. **Internal-link plan** (in / out)
5. **Photo brief** if reshooting/captioning needed
6. **Optional testimonial outreach** to the client if a quote should be added

For an 8-project commission, deliver an index doc + 8 individual case-study files following a consistent template.

## Related skills

- `trust-signals` — case studies are part of the trust-signal stack
- `schema-rollout` — for the surrounding schema layer
- `city-page` — case studies link prominently from city pages
- `cost-pillar` — case studies provide the "recent project examples" block
