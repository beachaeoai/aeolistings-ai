---
title: "How to check if ChatGPT recommends your business"
description: "A practical, repeatable method for testing whether ChatGPT, Claude, Perplexity, and Google AI Overview cite your business — and what to do with the answer."
pubDate: 2026-04-22
author: "AEO Listings"
tags: ["measurement", "audit", "tactics"]
draft: true
---

**The fastest way to check whether ChatGPT (or Claude, Perplexity, or Google AI Overview) recommends your business: write a list of ten to twenty buyer-intent questions a real prospect would type — phrased the way prospects actually phrase them — then run each through every chatbot in a clean session, three times each, recording every business named. Track three numbers: how often you appear at all (citation rate), in what position relative to competitors (rank), and whether you're described correctly (sentiment). Doing this once is an audit. Doing it monthly is measurement.**

Most local businesses skip this step entirely, then assume nothing's happening in AI search because they "didn't notice anything." Five minutes of structured testing changes the picture.

## Step 1: Write the prompt set

Aim for ten to twenty prompts that match how real prospects ask. Three rules:

- **Buyer-intent, not branded.** "Best plumber in Phoenix for repipes" is buyer-intent. "Tell me about Smith Plumbing" is branded — a chatbot recommending you when someone already typed your name is not the test.
- **Specific to category and geography.** Models will hedge on vague prompts. "I have a slab leak in north Tempe and need someone tomorrow morning" gets a more honest answer than "find a plumber."
- **Include the questions you wish you got asked.** If you specialize in tankless water heaters, include three prompts that surface that.

A simple template per category:
- "Who's the best [trade] in [city]?"
- "I need [specific service] in [neighborhood]. Who do you recommend?"
- "What [trade] in [city] does [niche service]?"
- "Recommend a [trade] in [city] who specializes in [vertical]."
- "I'm looking for a [trade] near [landmark/neighborhood] who [specific need]."

Twelve prompts is enough to get a real signal without becoming a project.

## Step 2: Run each prompt against four chatbots

The four that matter for buyer-intent local search in 2026:

1. **ChatGPT** (with web browsing on)
2. **Claude** (Sonnet or Opus, with web search on)
3. **Perplexity**
4. **Google AI Overview** (run the prompt as a Google search and read the AI summary, not the link list)

A few methodological notes that materially change the answer:

- **Use a fresh session each time.** Prior chat context biases the model. Open a new conversation per prompt.
- **Sign out or use incognito for ChatGPT/Gemini.** Personalization can favor businesses you've previously interacted with.
- **Run each prompt three times.** LLM outputs are stochastic. A single run is a data point; three runs is a small distribution.
- **Don't use VPN tricks.** Unless you're testing for a market other than where the business operates, your real geolocation is the right input.

## Step 3: Record three things per prompt

For every result, write down:

- **Citation:** was your business named at all? (Yes / No)
- **Position:** if multiple businesses were named, which one was first? Second? Third?
- **Sentiment:** how was your business described? Correctly? With outdated information? With phrasing that would or wouldn't make a prospect call?

A simple spreadsheet with columns *prompt / chatbot / run / cited / position / description / competitors named* gives you everything you need.

## Step 4: Read the picture

After running twelve prompts × four chatbots × three runs (144 cells), four patterns usually emerge:

- **Strong on some chatbots, invisible on others.** Common when entity signals are good but passage retrieval is weak — Perplexity and Google AI Overview tend to cite you, ChatGPT and Claude don't.
- **Visible but mis-described.** The model named you but called you "a Phoenix plumber" when you're a roofer, or said you've been in business since 2015 when it's actually 2008. This means corroboration is contradictory across sources.
- **Cited only on branded prompts.** The model knows you exist but doesn't surface you against open buyer-intent questions. Classic entity-without-corroboration pattern.
- **Competitors named instead.** The most useful finding. Write down which competitors are named, and how often. That competitor list is your reverse-engineered roadmap: figure out what those businesses are doing well across entity, corroboration, retrievability, and recency that you're not.

## Step 5: Decide what to actually do

The audit is only useful if it drives action. Three failure modes are most common, with their corresponding fixes:

- **Not cited anywhere.** Almost always an entity discipline problem. Fix the Google Business Profile, audit citations, deploy schema, and only then expect the rest to matter.
- **Cited inconsistently.** Usually a passage-retrievability problem. The model knows you exist but can't find content that cleanly answers the buyer's question. Restructure the highest-intent service pages around answer-first H2s.
- **Cited but with stale info.** A freshness problem. Update content with current dates, build review velocity, kill any contradicting old pages.

## How often to repeat

Quarterly is the minimum to detect drift. Monthly is what we run for clients on retainer — it catches model updates and competitor moves while they're still small.

This isn't a project. It's a practice. Citation share moves the same way revenue moves: in small increments, watched closely.
