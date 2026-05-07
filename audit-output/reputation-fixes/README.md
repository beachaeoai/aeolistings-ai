# Reputation Fixes — Cruz & Eco Roofing

*Generated 2026-05-01 from baseline AEO prompt-tracker findings · Aeolistings*

Two reputation-level findings surfaced in the May 2026 baseline runs that the visibility audits did not catch. Both need fixes this week before they compound.

## Cruz Development — Matthew Gallego mis-attribution

**Problem:** Google AI Overview answers for *"Matthew Gallego custom home builder"* cite stale ZoomInfo data identifying him as a Project Manager at Starwood Custom Homes (his prior employer) rather than founder of Cruz Development.

**Fix package:**
1. **[Matthew Gallego named-expert page](cruz-development/01-matthew-gallego-page.md)** — `/about/matthew-gallego/` with Person schema and the substantive credentials AI Overview will pull instead of ZoomInfo
2. **[ZoomInfo correction request](cruz-development/02-zoominfo-correction-request.md)** — formal request to update the stale record (active intervention path)
3. **[Client outreach template](cruz-development/03-client-outreach-template.md)** — request for Houzz / Google reviews mentioning Matthew by name (rebalances the citation corpus)

## Eco Roofing Solutions — ROC complaint surfacing in branded queries

**Problem:** Branded queries (*"Is Eco Roofing Solutions reputable"*, *"Eco Roofing Solutions Gilbert reviews"*) currently surface a verbatim 1-star ROC complaint quote in Google AI Overview — the complaint gets ~1/3 of the answer's weight on the highest-intent prompts in the entire prompt set.

**Fix package:**
1. **[Customer Commitment / Resolution page](eco-roofing/01-reputation-page.md)** — substantive content about how Eco Roof handles disputes, rebuild-to-spec commitment, named contact for escalation. Gives AI Overview better content to quote.
2. **[Branded-query FAQ block](eco-roofing/02-faq-block-branded.md)** — citation-worthy answers to "Is Eco Roofing Solutions reputable", embedded in About + Contact + new Resolution page
3. **[ROC complaint follow-up](eco-roofing/03-roc-complaint-followup.md)** — formal closure-documentation request to AZ ROC (active intervention path; closure status updates can shift the public record)
4. **[HomeAdvisor → Google outreach template](eco-roofing/04-review-outreach-template.md)** — short, specific message asking the existing satisfied HomeAdvisor reviewers to also leave Google reviews. Directly competes with the complaint quote in branded-query weighting.

## Sequencing

Both packages can run in parallel — different teams, different content. Suggested order within each:

1. **Day 1–2:** Ship the page (`01-...`) and FAQ block. AI Overview re-crawl starts.
2. **Day 1:** Send outreach (`03/04-...`) — fastest moving, depends on third-party response time.
3. **Day 3–7:** Send formal correction requests (ZoomInfo / ROC). Slowest moving, but the most durable.

Expected timeline:
- **Active items (outreach + corrections):** 15–30 days to see citation-corpus shifts
- **Content items (page + FAQ):** 30–60 days for AI Overview to re-weight
- **Both:** verified in the **June 1 monthly prompt-tracker run** (baseline already in `audit-output/aeo-tracking/`)

## Approval workflow

Each piece needs the relevant party's review/approval before shipping:

- **Cruz items:** Matthew Gallego (founder approval on bio + outreach tone)
- **Eco Roofing items:** Eric Perry (owner approval on commitment page + ROC follow-up — sensitive)

The drafts below assume voice approval and contact details get filled in by the client. Where placeholders exist, they're flagged in `[BRACKETS]`.
