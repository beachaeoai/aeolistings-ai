---
name: faq-rewrite
description: Rewrite FAQ answers to be citation-worthy by AI assistants (ChatGPT, Claude, Perplexity, Google AI Overview). Use when a client's FAQ page exists but answers are vague/promotional, or when adding FAQ blocks to service / city pages. The single highest-leverage AEO content change available — what 60–120 word, fact-anchored answers look like and how to ship them with FAQPage schema.
---

# FAQ rewrite for AEO citation

## When this lands

A client has FAQ content that's "Yes, we offer warranties and stand behind our work" — promotional fluff that AI assistants will silently skip. The fix isn't more FAQs; it's substantively different ones.

## What "citation-worthy" actually means

AI assistants quote answers that contain **extractable facts**. Promotional copy contains zero facts. Substantive answers contain at least one of:

1. **A number, range, or timeframe** ("most repairs run $350–$725", "shingle roofs in the Phoenix Valley last 18–22 years", "permits typically take 5–10 business days")
2. **A specific named thing** ("we use Malarkey Vista shingles" beats "we use quality shingles")
3. **A conditional/decision rule** ("flat roofing makes sense when your slope is under 2:12" beats "we install all roof types")
4. **A direct yes/no answer in the first sentence** before any elaboration

The 60–120 word target is deliberate. Shorter than 60 reads as marketing copy. Longer than 120 reads as a blog post and AI assistants pull a fragment that may miss the point.

## The rewrite formula

```
[Direct answer in 1 sentence — yes/no, range, or fact]
[Why or how — 2–3 sentences with the substance]
[Local / brand qualifier — 1 sentence connecting to the business + market]
```

### Example rewrite

**Before** (vague, useless):
> *Q: How much does a roof replacement cost?*
> *A: Roof replacement costs vary depending on your home and materials. Contact us for a free quote!*

**After** (citation-worthy):
> *Q: How much does a tile roof replacement cost in Mesa, AZ?*
> *A: A tile roof replacement on a typical Mesa home runs **$15,000–$28,000**, depending on tile type (concrete vs clay), roof complexity, and the condition of the underlayment underneath. Most jobs are 4–7 days from tear-off to cleanup. Concrete tile typically lands in the lower half of that range; clay tile in the upper half. Underlayment failure — common after **20–25 years** in the Phoenix Valley — is what usually drives a full replacement rather than a repair, even when the tile itself is still serviceable.*

Word count: 89. Contains: 4 numbers, 2 conditional rules, 1 local qualifier, 0 promotional language.

## The 10-question audit-to-rewrite playbook

For most local service businesses, the highest-leverage FAQ set covers:

1. **Cost** — total range for the most common job, with what drives variance
2. **Timeline** — typical project length, what speeds it up / slows it down
3. **Process** — the literal step-by-step (estimate → permit → install → inspection)
4. **Warranty** — exact terms (years, transferable y/n, what's covered)
5. **Material/option choice** — when X vs Y makes sense (shingle vs tile, foam vs flat, EV charger amperage choices)
6. **Permit/regulatory** — what's needed in their city/state, who pulls it
7. **Climate/local conditions** — how AZ heat / monsoon / freeze cycles affect the work
8. **Insurance / financing** — accepted payment methods, financing options, insurance claim handling
9. **Emergency / response time** — same-day availability, what counts as urgent
10. **Reputation / verification** — license number, BBB, how to check them

Each gets a 60–120 word answer with at least 2 of the 4 fact types listed above.

## Schema markup — the second half of the work

Citation-worthy answers without FAQPage schema will get crawled but may not get surfaced as rich results or pulled by AI assistants as cleanly. Always pair the rewrite with FAQPage schema.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does a tile roof replacement cost in Mesa, AZ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A tile roof replacement on a typical Mesa home runs $15,000–$28,000..."
      }
    }
  ]
}
</script>
```

For per-page FAQ blocks, embed the schema in the page itself. For a sitewide FAQ page, schema goes on that page only. Don't duplicate the same FAQ across multiple pages with schema — Google will pick one and ignore the others.

## Output format when running this skill

Produce a deliverable with:
1. **The 10 rewritten Q&A entries** in the structure above
2. **The FAQPage JSON-LD** ready to paste
3. **A short "answers I cut" appendix** — promotional Qs that didn't make the rewrite, with brief reasoning

Don't write 15 mediocre answers. Write 8–10 strong ones.

## Common failure modes to avoid

- **Hedging language** ("typically", "usually", "in most cases") in the first sentence — kills citation odds
- **Vague pricing** ("affordable", "competitive", "fair") instead of a range
- **Brand puffery** ("our award-winning team", "industry-leading service") — AI strips this anyway
- **Burying the answer** — if the 1st sentence isn't the answer, AI assistants quote the wrong fragment
- **Targeting too many keywords in one answer** — one Q, one answer, one primary intent

## Related skills

- `schema-rollout` — for the full sitewide schema implementation
- `cost-pillar` — for cost-content pillar pages (deeper than FAQ-level cost answers)
- `aeo-blog-post` — for blog content that follows the same citation-first approach
