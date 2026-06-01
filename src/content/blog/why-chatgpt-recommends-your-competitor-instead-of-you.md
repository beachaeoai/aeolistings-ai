---
title: "Why ChatGPT recommends your competitor instead of you"
description: "When ChatGPT, Claude, or Perplexity names a competitor and not you, the cause is rarely the obvious one. Five specific patterns explain almost every case — and each has a different fix."
pubDate: 2026-06-02
author: "AEO Listings"
tags: ["diagnostics", "competitor-analysis", "tactics"]
draft: true
---

**When an AI chatbot recommends your competitor and not you for a buyer-intent prompt, the cause is rarely "they have more reviews" or "they're better at SEO." In our work across home service and local professional businesses, almost every case fits one of five specific patterns: an entity-signal asymmetry, a passage-retrievability gap, a recency gap, a corroboration gap, or a category-specificity mismatch. The first step is identifying which one — because the fix for each is different, and applying the wrong fix wastes months.**

This is the most common question we get from prospects after they've run their own citation audit. They've seen the result, they've identified the competitor, and they want to know why. Here's how to diagnose which of the five patterns is actually at work.

## Pattern 1: Entity signal asymmetry

The single most common cause. Your competitor has cleaner, more consistent entity signals across the web than you do — name, address, phone, category, service area — and the LLM is more confident about who they are.

Concrete signs you're hit by this:

- The competitor's business name resolves identically across Google, Yelp, BBB, and 3+ industry directories. Yours has variations ("Smith Plumbing," "Smith Plumbing LLC," "Smith's Plumbing of Phoenix").
- The competitor's Google Business Profile has every field filled — services list, hours, attributes, photos, Q&A. Yours has the basics.
- The competitor's schema.org markup on their site declares them as a `LocalBusiness` or `ProfessionalService` with full structured data. Your site has no schema, or only generic `Organization`.

**The fix**: entity discipline. Audit NAP consistency across the directories that matter for your trade. Complete the Google Business Profile. Ship Schema.org markup. This is unglamorous foundation work that compounds — and until it's done, no other AEO work performs well.

## Pattern 2: Passage retrievability gap

Your competitor's site has a paragraph somewhere that directly answers the prompt the buyer typed. Yours doesn't — even if your overall content is better.

LLM retrieval pulls passages, not pages. When a buyer asks "do you do tankless water heater installation in Phoenix?" and ChatGPT browses for an answer, it's scoring individual paragraphs across the candidate sites. The site that has a paragraph reading "We install tankless water heaters across the Phoenix metro, including under-warranty replacement on every major brand…" wins the retrieval. The site with a 3,000-word ultimate guide on water heaters — that doesn't say those specific words anywhere — loses it.

Concrete signs you're hit by this:

- Your competitor's service pages have question-shaped H2s ("Do you do X in [city]?", "How long does Y take?") with short direct answers below.
- Your own service pages have marketing throat-clearing before the actual service description ("At Smith Plumbing, we pride ourselves on delivering excellence…").
- When you read your service page out loud, the actual answer to "what do they do?" doesn't appear in the first 60 words.

**The fix**: restructure your highest-intent service pages around answer-first H2s and self-contained paragraphs. We have a separate piece on what this looks like in practice. The work is editorial, not technical, and it can lift citation share within weeks.

## Pattern 3: Recency gap

Your competitor looks alive on every freshness signal LLMs check. You look stale on some of them, or like you closed three years ago.

LLMs augment training data with live retrieval — Bing/Brave for ChatGPT, Google for Gemini and AI Overview, internal indexes for Perplexity. All of them weight recent signals heavily, partly to avoid recommending defunct businesses.

Concrete signs you're hit by this:

- Your competitor's most recent Google review is from this month. Yours is from 18 months ago.
- Your competitor's blog has a post dated within the last 60 days. Your blog hasn't been updated in two years (or you don't have one).
- Your competitor's social profiles show activity. Yours have a profile picture from 2021 and no posts since.
- A 2023 article somewhere said your business was "rumored to be closing" or "moving locations." Nothing newer contradicts it.

**The fix**: review velocity (the biggest lever), regular content updates, and explicit contradiction of any stale negative signal. If a 2023 article incorrectly says you closed, the fastest fix is publishing a 200-word post dated this month that clearly states the business is open and operating.

## Pattern 4: Corroboration gap

The model has heard about your competitor from many independent sources, all saying the same thing about what they do. It's only heard about you from your own website.

LLM training data is built from crawling the web. Your competitor exists in the model's representation as "a residential roofer in Tucson specializing in tile" because twelve different directories, three local news articles, and a chamber of commerce page all describe them that way. You exist as "a roofer maybe in Arizona" because your own homepage is the only source making any claim.

Concrete signs you're hit by this:

- Your competitor shows up correctly described in news articles, podcasts, or industry publications. You don't appear in any third-party content.
- Your competitor has profiles on industry-specific directories (Houzz, Angi, GAF Master Elite, etc.) that match what their site says. You're listed on the major directories generically, with no service-specific detail.
- Your competitor has been quoted in a local newspaper article. You haven't.

**The fix**: this one takes the longest because it's mostly off-site work. Industry-specific directory placements with rich service descriptions, securing mentions in trade press, contributing expert quotes to local journalists working on home-improvement stories. None of it is instant; the compound effect over 6–12 months is significant.

## Pattern 5: Category specificity mismatch

The buyer's prompt was specific. Your competitor positions specifically. You position generally.

When a buyer asks "best HVAC company in Mesa for older homes with original ductwork," the model retrieves businesses that have specifically described themselves as serving older homes or as ductwork specialists. A general HVAC company that "serves all of Mesa" is structurally less retrievable for the specific prompt, even if they are technically capable of doing the work.

Concrete signs you're hit by this:

- Your competitor's homepage has a section titled "Our specialty: X" where X is a real niche.
- Your competitor's About page mentions specific trade certifications, brand specializations, or industry-narrow experience.
- Your homepage describes you as "your trusted local [trade]" with no specific positioning beyond geography.

**The fix**: decide what you're actually best at, then say it specifically on your site. The fear is that narrowing scope loses generic buyers — but in practice, the buyers who type into ChatGPT are usually the ones with specific needs. Generic positioning is what loses citations.

## Diagnosing your specific case

The five patterns aren't mutually exclusive — most businesses we audit are hit by two or three at once. The order to investigate is the order listed above: entity signals first, because nothing else works without them; then passage retrievability, because it's the highest-ROI fix; then recency; then corroboration; then specificity.

A useful exercise: pull up the competitor that keeps getting cited instead of you, and walk through the five patterns. For each one, write down whether it applies — and to what degree. The pattern that scores highest is where you start.

## What this isn't

Three things this analysis is not:

- **Not a guarantee** — LLM behavior shifts, models update, and any given prompt has stochastic variation. The five patterns explain the steady-state difference; they don't predict any single answer.
- **Not a vanity exercise** — knowing why a competitor wins doesn't matter if you don't actually do the work to close the gap. The patterns are diagnostic, not therapeutic.
- **Not a substitute for being good at your job** — if a competitor is genuinely better at the work (faster response times, higher-quality outcomes, fairer pricing), AEO won't change the fundamentals of who deserves the citation. It can change who gets it for a while, but the underlying business has to be sound.

The goal isn't to game LLMs. It's to make sure that when a buyer asks an AI chatbot for a recommendation in your category, the model is choosing on the actual merits — not on which business happened to make its entity signals legible.
