---
title: "FAQ schema for local businesses: when it actually helps"
description: "What FAQPage schema does for a local service business in 2026, when it materially moves citation share, and the common mistakes that produce zero lift."
pubDate: 2026-05-25
author: "AEO Listings"
tags: ["technical", "schema", "implementation"]
draft: true
---

**FAQPage schema, deployed correctly on a local-business site, increases citation likelihood on Google AI Overview and Perplexity by a meaningful margin — likely 15 to 30 percent of relevant queries in the first 60 to 90 days after rollout, based on observable client data. The lift is real but conditional: it only happens when the underlying FAQ content is citation-worthy (specific facts, numbers, conditional rules — not marketing copy), when the schema markup matches the on-page text exactly, and when the FAQs are deployed on pages with topical relevance to the question. Most "we added FAQ schema" deployments fail one of those three conditions and produce zero measurable lift.**

FAQPage schema is one of the most-discussed and least-correctly-implemented Schema.org types for local businesses. The mechanics are well-documented; the conditions under which it actually helps are not.

## What FAQPage schema does, technically

FAQPage schema is a structured-data wrapper that declares a section of a webpage as a question-and-answer block. The basic shape:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does a tile roof cost in Phoenix?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A tile roof replacement on a typical Phoenix home runs $15,000 to $28,000..."
      }
    }
  ]
}
```

Two technical points worth knowing:

1. The `text` field in the answer should match the on-page visible answer text exactly. Google has deprecated FAQ rich results in regular search since 2023, but AI Overview and other retrieval-based answer engines still parse the schema as a hint about which on-page text is the canonical answer to which question.
2. Multiple FAQPage schema blocks on a single domain (one per relevant page) work better than a single FAQ-page-as-database approach. Each instance should be on the page where the question would naturally arise.

## Why most deployments fail

The mistake most agencies make: they treat FAQ schema as a checkbox. They add the schema, the FAQ content is identical to what was already on the page (or pulled from generic marketing copy), and they declare the work done. No measurable lift follows, because the underlying content didn't change — the schema just wrapped already-uncitable content in slightly more parseable JSON.

The three conditions for meaningful lift:

### 1. The answer text has to be citation-worthy

A citation-worthy answer contains at least one of: a specific number, a specific timeframe, a named entity (place, product, person), or a conditional rule. Marketing-copy answers — "Yes, we offer warranties on all our work!" — don't get cited because they don't contain anything an AI assistant can quote.

Length matters too. Answers between 60 and 120 words tend to perform best — long enough to be substantive, short enough to be fully cited rather than partially excerpted.

### 2. The schema has to match the on-page text exactly

Google and other parsers compare the `text` field in your schema to what's actually visible on the page. If the schema says one thing and the page renders something different, the parser ignores both as inconsistent. This breaks more often than expected — usually when a developer copies an old answer into the schema and forgets to update it when the on-page copy changes.

A reliable approach: generate the schema from the page content programmatically, not from a separate source of truth. If your CMS renders the FAQ block, it should also generate the JSON-LD from the same data.

### 3. FAQs should live on the right page

A common mistake: putting all FAQs on a `/faq` page and assuming that's enough. It's not. AI assistants cite from contextual relevance — a roofing question on a roofing service page cites more reliably than the same question on a generic site-wide FAQ page.

Practical rule: every service page should have a 4-to-6-question FAQ section relevant to *that service*, with its own FAQPage schema block. Site-wide FAQs can exist in addition, but they should be the lowest-priority deployment, not the only one.

## When FAQ schema produces no lift

Three failure modes worth knowing:

- **Generic answers** — "Yes, we're licensed and insured. Contact us for details!" gets no citation lift. Answers without specifics produce no AI-quotable content.
- **Stale answers** — answers written years ago that mention specifics that are now wrong (an old price, an outdated regulation, a discontinued product) actively damage citation likelihood because AI assistants will catch the inaccuracy in their retrieval cross-check.
- **Duplicate schema** — the same FAQPage schema deployed identically across multiple pages signals to Google that none of the pages is the canonical source, which suppresses the lift across all of them.

## The questions that move the needle

For a local services business, the FAQ questions that produce the most citation lift are usually the ones the business is most reluctant to answer in writing. Specifically:

- Cost questions ("how much does X cost in [city]")
- Timeline questions ("how long does X take")
- Process questions ("what does X involve, step by step")
- Permit and regulatory questions ("do I need a permit for X")
- Comparison questions ("X vs Y, which is right for me")

These are the questions buyers actually ask AI assistants. They're also the questions that, for legitimate reasons, businesses tend to keep vague — pricing varies, timelines depend on conditions, comparisons risk losing a sale. The agencies that get FAQ schema to work get the business owner past that reluctance and into concrete, range-based answers that AI assistants can cite.

## A reasonable deployment checklist

For a local business looking to deploy FAQ schema that actually moves citations:

- Identify the 5 to 7 service pages that should have their own FAQ blocks
- Write 4 to 6 questions per page, focused on cost / timeline / process / regulatory / comparison
- Write answers in the 60-to-120-word range, with at least one number or specific fact per answer
- Deploy schema generated from the same data source as the visible page text
- Verify each page with Google's Rich Results Test
- Re-audit the answers every 6 months — facts go stale, prices change

That's it. Boring, methodical, and disproportionately effective compared to the "add FAQ schema sitewide" approaches most agencies ship.

## The honest summary

FAQ schema isn't a magic trick. It's one part of a broader AEO foundation that works when the underlying content is citation-worthy and the deployment is correct, and produces nothing when either condition fails. Most deployments fail at least one condition. The agencies whose clients see lift are the ones who treat FAQ schema as a content discipline, not a markup task.
