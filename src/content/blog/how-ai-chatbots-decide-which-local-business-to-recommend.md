---
title: "How AI chatbots decide which local business to recommend"
description: "ChatGPT, Claude, Perplexity, and Gemini don't pick local businesses at random. A walk through the retrieval signals that actually drive who gets named."
pubDate: 2026-04-18
author: "AEO Listings"
tags: ["fundamentals", "retrieval", "local"]
draft: true
---

**When an AI chatbot is asked "who's a good plumber in Phoenix?", it isn't running a Google search and reading the results. It is selecting from entities it already knows about, weighted by entity strength (how clearly it can identify the business), corroboration (how many trusted sources describe the business consistently), retrievability (whether the business's own pages cleanly answer the question), and recency (whether anything contradicts what the model believed at training time).**

These four signals — entity strength, corroboration, retrievability, recency — are the practical levers for getting recommended. None of them are a "ranking factor" in the SEO sense. They are properties of how the underlying model represents your business, and they behave differently from PageRank.

## Entity strength

A model can only recommend businesses it can confidently identify. That requires:

- A canonical name that resolves the same way everywhere it appears (no "Smith Plumbing" / "Smith Plumbing LLC" / "Smith's Plumbing of Phoenix" drift across directories).
- A clean Google Business Profile with category, hours, service area, and structured services filled in.
- Schema.org markup on your own site declaring the business as an `Organization` or `ProfessionalService` with consistent NAP (name, address, phone).
- Presence in the high-trust local directories the model's training corpus actually contains: Google Maps, Yelp, BBB, the Better-than-average industry-specific directories for your trade.

If a model is uncertain whether two listings are the same business, it tends to recommend neither. Entity disambiguation is the first gate.

## Corroboration

Once the entity is known, the model checks how many independent sources describe it the same way. A business with twelve directory listings, a Wikipedia mention, and three local-press articles that all describe it as "a residential plumber in Phoenix specializing in repipes" is a stronger candidate than one whose own homepage is the only source making that claim.

The practical implication: getting cited by AI is partly an off-site problem. Your website tells the model what you do; the rest of the web tells the model whether to believe it.

## Retrievability

When a chatbot answers a buyer-intent question, it retrieves passages — not whole pages. Passages get retrieved when they are:

- Short and self-contained (a paragraph that answers the question without requiring the rest of the page).
- Marked up with a question-shaped heading (H2/H3) the retrieval index can match against.
- Free of marketing throat-clearing before the actual answer.

A page titled "Welcome to Smith Plumbing!" with three paragraphs of mission statement before any service detail is functionally invisible. A page with an H2 reading "Do you do tankless water heater installation in Phoenix?" followed by a 60-word direct answer is a retrieval target.

## Recency

LLMs have training cutoffs and increasingly augment with live retrieval (Bing/Brave for ChatGPT and Copilot, Google for Gemini and AI Overview, internal indexes for Perplexity). Three forces shape recency:

- **Fresh reviews.** A business with the most recent five-star review from three weeks ago looks alive. One whose last review is from 2022 looks defunct.
- **Updated content.** A pricing page dated this year is trusted over one with no date or a stale one.
- **Contradicting newer signals.** If the model believed your business closed (because a 2023 article said so) and nothing newer contradicts it, you will not be recommended even if you are open and thriving.

## What this means for the work

Getting recommended by AI is not one project. It is four parallel disciplines:

1. **Entity discipline** — fix every directory, lock down the schema, kill the name variants.
2. **Corroboration building** — get described correctly by sources you don't control.
3. **Answer-shaped content** — restructure the website so the model has clean passages to retrieve.
4. **Freshness operations** — review velocity and ongoing content updates so nothing about you looks stale.

Most local businesses have done some of one of these (usually the first, and partially). The four together is what changes citation share.
