---
title: "What is llms.txt, and should my business have one?"
description: "A definitional explainer on /llms.txt — what it is, what it isn't, which crawlers actually use it, and when it's worth shipping."
pubDate: 2026-04-21
author: "AEO Listings"
tags: ["technical", "fundamentals", "standards"]
draft: true
---

**`/llms.txt` is a plain-text file at the root of a website (e.g., `https://example.com/llms.txt`) that summarizes the site's purpose and links to its most important pages, written in a Markdown format optimized for large language models to ingest. It is a proposed convention, not an industry standard. Major LLM crawlers — OpenAI's GPTBot, Anthropic's ClaudeBot, Google-Extended, PerplexityBot — do not currently announce that they consume `llms.txt` differently from regular HTML. Shipping one is cheap, mildly helpful as a summary entry point for any LLM that does respect it, and useful as a forcing function for clarifying your own site's information architecture.**

In other words: yes, you should probably ship one, but for different reasons than the breathless takes suggest.

## Where llms.txt came from

The convention was proposed by Jeremy Howard (of fast.ai and Answer.AI) in late 2024 as a way for sites to give LLMs a curated "front door." The format is intentionally minimal:

- A top-level `# Site Name` heading.
- A blockquote with a one-paragraph summary.
- A few paragraphs of context describing what the site is and what it covers.
- One or more `## Section` headings, each with a Markdown list of links to important pages.

There is also an extended convention, `llms-full.txt`, which contains the full Markdown content of the site (or its most important pages) inlined, intended for LLMs that want to ingest a site without crawling.

Neither is mandated by any web standard body. Neither has been formally adopted by any major LLM operator as a primary signal.

## What llms.txt is not

A few persistent confusions worth flattening:

- **It's not a robots.txt for LLMs.** Crawl permissions are governed by `robots.txt` and the `User-agent` directives that name specific bots (`GPTBot`, `ClaudeBot`, `Google-Extended`, etc.). `llms.txt` is content, not access control.
- **It's not a ranking signal.** No public LLM operator has stated that the presence of `llms.txt` improves citation likelihood.
- **It's not a substitute for Schema.org markup.** Structured data on your individual pages is doing different work — declaring entity types, relationships, and properties. `llms.txt` is a curated index of human-readable summaries.
- **It's not a substitute for `sitemap.xml`.** Sitemaps tell crawlers what URLs exist; `llms.txt` describes what those URLs mean.

## Why ship it anyway

Three reasons make it worth the hour or two of work:

### 1. Asymmetric upside

If even one major LLM begins using `llms.txt` as a summary signal in the next twelve months — and the format costs you maybe ninety minutes to produce — the expected value is positive. The downside of having one no operator currently parses is approximately zero.

### 2. It's a forcing function

Writing a clean `llms.txt` requires answering: what is this site for, in two sentences? What are the five to ten pages a stranger should read first? Most marketing sites can't answer these crisply. The exercise of writing the file usually surfaces structural issues — pages that should exist and don't, pages that exist and shouldn't, descriptions that contradict what the site actually offers.

### 3. It's a citable artifact

Even if no LLM crawler treats `llms.txt` specially, it's a Markdown document on your site that any crawler can fetch. A model parsing it as regular HTML still gets the benefit of a clean, structured summary of your business. That's not nothing.

## What a good llms.txt looks like for a local services business

Keep it boring and accurate. Five sections, in this order:

1. **Site name and one-paragraph blockquote summary.** What is this business, in plain English.
2. **Two or three paragraphs of context.** Service area, model of work, pricing model, what makes the offer distinctive — written as fact, not marketing copy.
3. **Core pages section.** A flat list of the four to seven most important pages with one-sentence descriptions. Home, services, about, contact, FAQ.
4. **Key facts section.** Company name, primary domain, service area, contact, voice. Things a model would otherwise guess at.
5. **What we do not do section.** This is the underrated one. Telling a model what's *not* in scope reduces the chance of being recommended for the wrong query.

Avoid: hype words, hedging, footnotes, anything that requires reading the rest of the site to make sense.

## Bottom line

`llms.txt` is not a magic bullet, and any agency that says it is should be discounted. It's a low-cost, asymmetric-upside artifact that doubles as a discipline exercise for site clarity. Most local businesses we work with end up shipping one — not because of what it does today, but because of what it might do tomorrow and what writing it forces us to clean up either way.
