---
name: aeo-blog-post
description: Write a single AEO-optimized blog post — the recurring content unit for the AEO retainer (~13/month for retainer clients). Use when producing blog content for an existing client. Built for AI citation, not for ranking on the keyword alone — the modern blog post earns its keep by being quoted in ChatGPT / Perplexity / Claude / Google AI Overview answers.
---

# AEO blog post — the citation unit

## When this lands

Standard recurring deliverable for the AEO Authority + Operations Retainer (~13 posts/month). One post per session, or batch of 2–4 if writing the week's queue at once.

## What's different from a "regular" blog post

A 2026 blog post that pays back is built differently than a 2020 SEO post:

| Old SEO post | AEO post |
|---|---|
| Keyword-optimized title | Question-shaped title |
| 1,500+ words for "thoroughness" | 600–1,400 words, fact-dense |
| Long intro before answer | Direct answer in first 2 sentences |
| Hedging language | Specific numbers, ranges, named things |
| One target keyword | One target *question* with 3–5 buyer intents |
| Internal links for SEO juice | Internal links for entity reinforcement |

The single biggest mental shift: **the goal isn't ranking #1 for the keyword.** The goal is being *the* source AI assistants quote when answering the question.

## Required structure

```
H1: [The question, written as a buyer asks it]
Examples:
- "How much does a tile roof replacement cost in Mesa, AZ?"
- "Why does my breaker keep tripping in summer?"
- "Custom home vs spec home in Arizona — which is right for me?"

## [Direct answer in 2 sentences max]
Lead with the answer. Range, fact, conditional rule. This is the AI-citation block.

## [The substance, broken into 4-6 H2 sections]
Each section is a sub-answer to a related question. Use H2/H3 hierarchy. Numbered
lists, tables, and named entities all help AI parsing.

## Common questions [in this category]
3-6 short FAQs with citation-worthy answers (60-120 words each). FAQPage schema.

## What we'd recommend
A short, honest take (not a sales pitch). Specific decision rules — "if you're
in [situation], we'd lean toward X."

## About the author
Named-expert byline (Eric Perry, third-generation roofer, AZ ROC #XXXXXX) with
1-2 line credential summary. Author schema linking back to About page.
```

## Word count target

**600–1,400 words.** Below 600 is too thin to rank or be cited. Above 1,400 reads as filler and AI assistants extract worse fragments. Sweet spot for cost / process / comparison posts is 900–1,200.

## Title patterns that work

- **"How much does X cost in [City], [Year]?"** — cost intent
- **"How long does X take in [Place]?"** — timeline intent
- **"X vs Y in [Place] — when each makes sense"** — comparison intent
- **"Do I need [permit / inspection / pre-work] for X in [Place]?"** — regulatory intent
- **"Why does [common issue] happen?"** — troubleshooting intent
- **"Should I [decision] before [trigger event]?"** — decision intent
- **"What's actually included in a [service / quote / warranty]?"** — specification intent

Avoid vague titles ("Tips for choosing a roofer", "The ultimate guide to..."). They underperform on AEO because no one types them as questions.

## Citation-worthiness rules (apply throughout)

Every post should contain at least:
- 3 specific numbers / ranges / timeframes
- 2 named local entities (city, neighborhood, permit office, named expert)
- 1 named manufacturer or product (when relevant to the category)
- 1 conditional decision rule

Hedging language ("typically", "usually", "in most cases") is permitted in moderation but never in the first paragraph.

## Schema for blog posts

Every blog post should ship with **Article** (or **BlogPosting**) schema and, if there's a FAQ block, **FAQPage** schema:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How much does a tile roof replacement cost in Mesa, AZ in 2026?",
  "datePublished": "2026-04-30",
  "dateModified": "2026-04-30",
  "author": {
    "@type": "Person",
    "name": "Eric Perry",
    "url": "https://example.com/about/eric-perry/"
  },
  "publisher": {
    "@id": "https://example.com/#business"
  },
  "image": "https://example.com/path/to/header-image.jpg",
  "about": {
    "@type": "Service",
    "name": "Tile Roof Replacement"
  }
}
</script>
```

## Internal-link plan

Every post should link to:
- 1–2 relevant service pages (in the body, with descriptive anchor text)
- The relevant city or cost pillar page (often the post is a "satellite" to a pillar)
- 1–2 related blog posts (creates a topical cluster)

The post should be linked *from*:
- The blog index
- The relevant service page (recent posts block)
- 1–2 related posts (cluster cross-linking)

## What blog posts NOT to write

- **Generic "tips" posts** ("5 things to consider before X")
- **Hedge-everything posts** ("Costs can vary based on many factors")
- **Stuffed keyword posts** ("Best Mesa AZ roofing contractor expert specialist")
- **Posts about the company itself** (those go on About / press pages)
- **Reposted manufacturer marketing copy** — Google penalizes
- **AI-generated boilerplate** without local fact density — defeats the entire AEO purpose

## Content cadence (for retainer clients)

The AEO retainer commits to ~13 blog posts/month (3/week). Plan a monthly calendar with:
- 4–6 cost / process / regulatory posts (the highest AEO leverage)
- 3–4 troubleshooting / educational posts
- 2–3 comparison / decision posts
- 1–2 timely / seasonal posts (monsoon prep, winter heat-pump checks, year-end tax credits)

Build a 90-day topical map per client so individual posts cluster around 5–7 pillar topics.

## Output format

For a single post, deliver:
1. **H1 + meta title + meta description** (the meta title should be slightly shorter than H1 for SERP display)
2. **Hero image brief** (or stock image source if no custom image needed)
3. **The full body in markdown**
4. **The FAQ block** with citation-worthy answers
5. **Article + FAQPage schema** ready to paste
6. **Internal-link plan** (in / out)
7. **Suggested URL slug**

For a monthly batch (~13 posts), deliver a content calendar + 13 individual post files.

## Related skills

- `cost-pillar` — pillar pages that blog posts feed into via internal links
- `faq-rewrite` — for the embedded FAQ block in each post
- `schema-rollout` — for the broader schema layer
- `gbp-post` — most blog posts can be repurposed as Google Posts (2x leverage per piece of work)
