---
name: gbp-optimize
description: Run a full Google Business Profile optimization workflow for a local service business — claim/rebuild, primary + secondary categories, photo strategy, attributes, Q&A seeding, owner-response sweep, NAP reconciliation across surfaces, name-collision cleanup, and review-request workflow setup. Use when a client's GBP is the limiting factor on Local Pack visibility (almost always — GBP signals are ~32% of local-pack ranking weight in 2026). Week-1 work that unlocks 60–90 day compounding gains.
---

# GBP optimization — Week 1 work, 60–90 day compounding gains

## When this lands

A client has a GBP that exists but isn't actively run. Common signals: low review count vs. their tenure, no owner responses, photo count <20, no posts, single primary category, mixed reviews unanswered. Or — worse — the GBP isn't claimed at all, or has a duplicate listing competing with the canonical one.

GBP signals are roughly **32% of local-pack ranking weight** in 2026 (per ServiceTitan, HardLabor, and Sterling Sky). Reviews are another **20%**. Together that's more than half of what determines whether a business shows up for "[service] near me" — which is where 80%+ of local search traffic flows.

## Pre-work — verify what's there before optimizing

Before touching anything, capture the baseline:

1. **Direct view of the GBP via Maps.** Star rating, review count, photo count, last review date, owner-response rate, posts cadence, primary category, secondary categories, attributes.
2. **NAP audit** — does the GBP address match the website? Houzz? Yelp? BBB? Often these drift.
3. **Duplicate listing check** — search for the brand name on Maps. If multiple pins show up, that's the first thing to resolve.
4. **Name-collision check** — is there a similarly named business? (Example: Cruz Development AZ vs cruzcruzdevelopment.com — both real entities.)

Don't skip this. Optimizing a GBP without baseline data means you can't measure the lift.

## The 14-step Week-1 workflow

### Step 1 — Claim or transfer ownership (Day 1)
Confirm the client controls the GBP. If not, run claim verification (postcard, phone, video — Google's options vary). Transfer ownership before any other work.

### Step 2 — Resolve duplicates (Day 1–3)
If two listings exist, request merge via Google Business Profile support. Don't delete the wrong one — request consolidation so reviews and history transfer.

### Step 3 — NAP reconciliation (Day 1–2)
Pick the canonical address, phone, and business name. Match it across:
- Website (footer, contact page, schema)
- Google Business Profile
- Houzz / Yelp / BBB / Angi / HomeAdvisor / Nextdoor / Facebook
- Industry directories (NAHB / HBACA for builders; ARCA for roofers; IEC / NECA for electricians)

NAP mismatch is a real ranking suppressor. Schema is only as good as the underlying NAP.

### Step 4 — Set the right primary category (Day 1)
The single biggest GBP ranking signal. **Be specific.** Custom Home Builder beats General Contractor. Roofing Contractor beats Construction. Electrician beats Electrical Engineer. The most specific available match wins.

Common 2026 category traps:
- "Construction Company" when "Custom Home Builder" or "General Contractor" applies
- "Electrical Engineer" when "Electrician" applies
- "Roofing Supply Store" when "Roofing Contractor" applies
- "HVAC Contractor" when "Air Conditioning Repair Service" applies

### Step 5 — Add 3–5 secondary categories (Day 1)
Each secondary category should reflect a service the business actually delivers and revenue stream. Don't pad. Common right answers:

- **Roofer:** Roof Repair Service, Gutter Installation Service, Solar Energy Equipment Supplier (if eco/solar angle)
- **Custom home builder:** Home Builder, General Contractor, Roofing Contractor (if vertically integrated)
- **Electrician:** Electrical Installation Service, Electric Vehicle Charging Station Contractor, Generator Installation Service

### Step 6 — Configure Service-Area Business (SAB) properly (Day 1–2)
For service businesses (most), the GBP should be configured as SAB, not storefront. The SAB radius/cities list must explicitly include the cities the business actually targets — Google won't infer from the website.

Cap at **20 cities**. List the priority ones first. Don't pad with cities the business doesn't actually serve.

### Step 7 — Rewrite the business description (Day 2)
750-character limit. Lead with the most specific local + service phrase. Include the primary category language. Mention the named expert/founder if applicable. Include a quantitative tenure or proof signal. Avoid puffery.

**Bad:** "Your trusted partner for all your roofing needs in Arizona. We pride ourselves on quality work and customer service!"

**Good:** "Eco Roofing Solutions is a Gilbert, AZ family-owned roofing contractor serving Mesa, Chandler, Scottsdale, and the East Valley since 2000. Specializing in tile, foam, and energy-efficient cool-roof systems for the Phoenix climate. Owner Eric Perry — third-generation roofer. AZ ROC #XXXXXX. Free estimates, drone inspections."

### Step 8 — Configure attributes (Day 2)

**Identity attributes** (when accurate):
- Family-owned, women-owned, veteran-owned, Black-owned, LGBTQ+ owned
- Founded year (if on the GBP option set)

**Service attributes** (the high-leverage ones):
- Free estimates, online estimates, online appointments
- Same-day service, 24/7 service
- Free Wi-Fi at office, wheelchair-accessible (if storefront)

**Language(s) spoken** — Spanish in Phoenix metro is meaningful for residential service businesses.

### Step 9 — Add 5–10 Products entries (Day 2–3)
Even for service businesses, the Products tab feeds AI Maps summaries. Each entry: photo, name, price (or "starting at" range), description, optional CTA.

For a roofer: Tile Roof Replacement, Foam Roof Application, Shingle Roof Installation, Roof Repair, Cool-Roof Coating, Free Drone Inspection.

### Step 10 — Photo upload (Day 3–5)
Target **30+ photos in week 1**, then **5+/week thereafter**. Mix:
- Owner / team photos (real humans, not stock)
- Truck / uniform / branded vehicle shots
- Job-site progress (before, during, after — labeled)
- Office / showroom (if applicable)
- Material / equipment close-ups

Geotag if possible. Name files descriptively before upload.

### Step 11 — Seed Q&A (Day 3–5)
**5–10 owner-posted questions and answers** covering the highest-intent buyer questions in the category. Each answer 60–120 words with citation-worthy facts. (See `faq-rewrite` skill.)

Example questions to seed:
- "How much does a tile roof replacement cost in Mesa?"
- "How long does a roof replacement take?"
- "Do you handle insurance claims?"
- "What's the difference between foam and tile roofing in the Phoenix climate?"
- "How do I know if my roof needs replacement vs repair?"

### Step 12 — Owner response sweep (Day 4–5)
Reply to **every existing review** — positive *and* negative. Google explicitly tracks response rate and speed. Even a single thoughtful response to a 1-star review materially shifts both human trust and ranking.

Response template patterns (see `review-response` skill):
- **5-star:** Specific thanks naming the service performed + a forward-looking comment
- **4-star:** Specific thanks + acknowledgment of what could have been better + improvement note
- **1–3 star:** Specific empathy + the actual fact pattern from the business's perspective + offer to make it right + named contact

### Step 13 — Wire the review-request workflow (Day 5–7)
The single biggest review-volume lever for most businesses is *asking customers to review on Google specifically* — not Yelp, not BBB, not HomeAdvisor.

Configure:
- A short-link to the GBP review form (Google's official format: `https://g.page/r/<placeId>/review`)
- The link goes in: post-job emails, invoices, follow-up texts, business cards
- Set internal target: 4+ new Google reviews per month (drives 5 → 20+ in 90 days)

Common mistake: directing customers to a generic review-collection tool that distributes reviews across platforms. For Local Pack ranking, Google reviews specifically are what compound.

### Step 14 — Begin posts cadence (Day 7+)
Google Posts are now both a top-tier ranking signal *and* a Google AI Overview citation source. Cadence target: **2 posts per week, sustained.**

Mix:
- 1 *What's New* per week — recent project, before/after photo, brief explainer
- 1 *Offer* / *Event* per week — seasonal promo, monsoon-prep awareness, free-inspection offer

If the client already produces blog content (e.g., for an AEO retainer), the posts can repurpose those — essentially free.

## What to expect

- **Week 1:** Profile completion, first photos uploaded, first review responses sent
- **Weeks 2–4:** Ranking drift visible in 3-pack appearances for "[service] near me" searches
- **Days 30–60:** Review velocity ramps; Q&A appears in AI summaries; first measurable lift in profile-driven calls
- **Days 60–90:** 3-pack inclusion for primary city searches becomes consistent; secondary cities appear

## Critical pitfalls

- **Don't fake reviews or pay for them.** Google detects this and has algorithmically aggressive penalties.
- **Don't pad secondary categories** — Google penalizes mismatch.
- **Don't claim attributes that aren't true** (e.g., 24/7 if not actually 24/7) — Q&A and reviews surface the truth.
- **Don't list cities you don't serve** — cross-referenced with website service area.
- **Don't set up a virtual office** to claim a city — Google detects coworking spaces and PO boxes.
- **Don't transfer ownership to an agency.** Manage as a manager-level user; the business should retain ownership.

## Output format when running this skill

Produce a Week-1 deliverable:

1. **Baseline snapshot** — where the GBP is today (rating, reviews, photos, owner-response rate, primary category, etc.)
2. **The 14-step worksheet completed** with what was done in each step
3. **The new business description** (750 char), category set, attribute list, Products list
4. **The 5–10 seeded Q&A entries** (matched to FAQ rewrite if also done)
5. **The review-request workflow** — the short-link, where it goes (invoices, texts, etc.)
6. **A 30/60/90-day measurement plan** — what to track and report on

## Related skills

- `faq-rewrite` — for the citation-worthy Q&A answers
- `schema-rollout` — for the website-side LocalBusiness schema that mirrors the GBP
- `review-response` — for the owner-response templates
- `gbp-post` — for ongoing posts cadence
- `trust-signals` — for off-platform reputation footprint (Houzz, BBB, NAHB, etc.)
