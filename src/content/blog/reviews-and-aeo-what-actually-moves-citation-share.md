---
title: "Reviews and AEO: what actually moves citation share"
description: "Reviews matter for AEO, but not the way most agencies sell it. Recency outweighs volume, sentiment specificity outweighs star rating, and what reviewers actually say about specific services often matters more than the headline number."
pubDate: 2026-07-11
author: "AEO Listings"
tags: ["reviews", "off-site", "tactics"]
---

**Reviews matter for AEO, but the conventional ranking framing — "get to 4.8 stars with 100 reviews and you're set" — misses what LLMs actually weight. Citation share is moved by three properties of your reviews in roughly this order of impact: recency (when was the last one), specificity (do reviewers describe the actual work in terms an LLM can retrieve), and trajectory (is the volume growing, stable, or shrinking). Star rating and total count are mostly floors — once you're above the credibility threshold for your trade, additional volume produces diminishing returns. The agency mistake is optimizing for volume when the real lever is recency and what reviewers say.**

This post is specifically about how reviews behave in AI citation, which is meaningfully different from how they behave in classic Google local-pack ranking. Some advice transfers; some doesn't.

## Why reviews matter to LLMs (and how it differs from Google ranking)

For Google's local pack, reviews are a ranking factor in a relatively well-understood way: count, average rating, and recency all contribute to a local-pack score. There's a known plateau — once you're at 4.7+ stars with 50+ reviews, additional volume has diminishing ranking impact.

For LLMs, the mechanism is different. Reviews are not a "ranking" signal because there's no ranking. Reviews matter for AEO because:

1. **They're freshness signals.** When ChatGPT or Perplexity checks whether a business is currently operating, recent reviews are one of the top signals. A business with the last review 18 months ago looks at-risk of being closed.

2. **They're corroboration signals.** When the model decides what kind of business you are — generalist or specialist, residential or commercial, fast-response or scheduled — reviewer language is one of the strongest sources. Multiple reviews mentioning "same-day repair" or "tankless installation" or "Old Town remodel" are richer entity signals than your own marketing copy.

3. **They're entity verification.** Models cross-reference reviewer-named work locations, services, and details against your own claims. Consistency strengthens entity confidence; contradiction weakens it.

The implication: review *quantity* matters less than the *content* and *recency* of the reviews you have. Two specific corollaries follow.

## The freshness signal is the most overlooked lever

Most local businesses we audit have one of these review-velocity patterns:

- **Healthy growth**: 4–10+ reviews per month, consistent across the trailing 12 months. AI systems treat this as a strong active-business signal.
- **Stalled**: had a burst of reviews 18+ months ago when the business actively asked, then nothing. Reads to LLMs as either "the business is struggling" or "the business no longer actively serves customers."
- **Sporadic**: 1–3 reviews per month with occasional gaps of 60–90 days. Reads as borderline — better than stalled, materially weaker than healthy growth.

The freshness signal is more powerful than the count for AEO. A business with 30 reviews where 4 are from the last 30 days is a stronger citation candidate than a business with 200 reviews where the latest is from 8 months ago. We see this consistently across audits.

**The practical implication**: if you have to choose between "ask harder for reviews from a few recent customers" and "import or solicit 50 older reviews," the recent ones win. Recency is the lever; total count is the floor.

## Specificity in review content compounds entity strength

Look at two real review patterns:

**Generic-positive (low AEO value)**:
> "Great service, would highly recommend. Smith Plumbing was professional, prompt, and reasonably priced. Five stars!"

**Specific-positive (high AEO value)**:
> "Smith Plumbing replaced our tankless water heater in Mesa same-day after our Navien unit failed under warranty. Mike pulled the failed unit, coordinated the warranty replacement with Navien directly, and had the new one installed and inspected by end of day. Permit handled, no extra charge for the inspection. This is our second time using them — first was a slab leak repair in 2024."

Both are five-star reviews. For AEO, the second one is worth roughly 5x the first because it gives the LLM:

- Specific service ("tankless water heater," "Navien")
- Specific city ("Mesa")
- Concrete process detail (warranty handling, permit, inspection)
- Speed claim with a number ("end of day")
- Repeat-customer signal ("our second time")

When ChatGPT answers "who's a good plumber for warranty work on Navien tankless systems in Mesa?", the second review is a retrieval target. The first one doesn't help at all.

**The practical implication**: the *ask* matters more than the cadence. When you request a review, give the customer a specific suggestion of what to mention — "if you have time, it would help us a lot if you'd mention the [specific service we just did] and that you're in [their city]." Most customers happily comply if you ask specifically. The conversion rate on "could you mention X" requests is barely lower than generic "could you leave a review" requests, but the AEO value of the resulting reviews is dramatically higher.

## Volume and rating are floors, not levers

There's a credibility threshold for any trade — below it, prospects (and models) deprioritize you regardless of what other signals look like. Rough numbers by category:

- **High-trust trades** (plumbing, HVAC, electrical, roofing): 25+ reviews, 4.5+ stars. Below this, you look new or troubled.
- **Lower-frequency trades** (remodelers, landscape designers, custom home builders): 15+ reviews, 4.6+ stars. Customers expect fewer reviews; quality bar is higher.
- **Local professionals** (dentists, attorneys, CPAs): 20+ reviews, 4.7+ stars. Professional trust signals are weighted higher; one or two specific complaints can hurt disproportionately.

Past these thresholds, more reviews do not meaningfully improve AEO outcomes. A 4.8 with 500 reviews is not cited more than a 4.8 with 75 reviews, holding everything else constant. The marginal returns from review #76 to review #100 are negligible.

This is *not* an argument for stopping at the floor. Continued review velocity matters (freshness signal). It's an argument against treating review-volume growth as the primary AEO metric to optimize for. Recency and content do more.

## Where to focus the ask

Most local businesses have one or two review platforms doing most of the work. For AEO purposes, the rough hierarchy:

1. **Google Business Profile** — by far the most weight. Every LLM that touches local data reads Google reviews. If you only have time to ask for reviews on one platform, it's this one.
2. **Industry-specific high-trust directories** for your trade. Houzz for remodelers, GAF Master Elite for roofers, BBB for general trust, Avvo for attorneys, Healthgrades for medical, etc. These carry weight because they're vertical-specific and harder to game.
3. **Yelp** — still meaningful but weighted lower than it used to be, partly because of well-known review-filtering and astroturfing issues.
4. **Facebook reviews** — minor signal, not worth focused effort.

The strategy: drive 70%+ of new reviews to Google, get a baseline presence on the relevant industry directory for your trade, accept other platforms passively.

## The tactical playbook

What this looks like in practice for a service business:

1. **Within 48 hours of every completed service**: send a text with a direct link to your Google review page and a one-sentence specific suggestion ("if you have a minute, mentioning the [specific service] would mean a lot"). 48-hour timing is critical — conversion drops 50%+ past the first week.

2. **Don't filter requests by likely outcome.** Asking only customers you expect to leave five stars is a short-term gain that backfires — Google detects the pattern and the BBB explicitly disallows it. Ask everyone. The occasional negative review is worth more than the suspicious-looking 5.0 average it would otherwise produce.

3. **Respond to every review, positive or negative.** Owner responses are themselves retrieval targets — and a thoughtful response to a critical review often does more for entity trust than the original review hurt.

4. **Track monthly trajectory, not just total.** A pulse chart of reviews-per-month is the right diagnostic. Watch for stalls (months with zero new reviews) and address the root cause — usually a process gap in how requests are being sent.

5. **Cross-reference review content against your prompt set.** If you're tracking the buyer-intent prompts that matter to your business (which you should be — see our citation audit post), check which prompts your reviews currently help retrieve for, and which ones they don't. Then bias your review-asks toward customers whose work matches the under-supported prompts.

That last point is where most agencies don't go, and it's where the highest-leverage gains live. Reviews aren't just freshness signal — they're prompt-specific retrieval material. Treat them that way and the lift compounds.
