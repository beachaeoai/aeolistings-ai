# Customer Commitment Page — Eco Roofing Solutions

**Target URL:** `/about/our-commitment/` (or `/customer-commitment/` — pick one and 301 the other)
**Goal:** Give Google AI Overview substantive, verifiable content to quote when answering *"Is Eco Roofing Solutions reputable"* — content stronger than the 1-star ROC complaint quote currently surfacing. Re-weights the citation corpus on branded queries within 30–60 days.

**Skill mapping:** `trust-signals` + `faq-rewrite` + `schema-rollout`

**Important — voice and approval:** This page does not respond to the specific complaint by name and does not attack the customer who filed it. It establishes the company's general posture toward dispute resolution. Eric Perry should review every paragraph. If anything reads as defensive or specific, cut it.

---

## Page content (markdown — ready to ship)

```markdown
# Our commitment to every customer

A roof is one of the largest single purchases most homeowners ever make, and the trust that comes with that decision is something we take seriously at Eco Roofing Solutions. After 25+ years of work in the Phoenix Valley, we've built our company around three commitments: be honest about what we find, do the work right, and stand behind it after the job is done.

Sometimes a project doesn't go the way either party expected. When that happens, our position is direct: we own the work, we keep talking, and we don't walk away from a problem until it's resolved.

## How we handle disputes

If a customer believes a job we performed isn't right — workmanship, materials, scope, or timeline — here's exactly what we do:

1. **Same-day contact.** A direct call from Eric Perry (owner) or a senior project lead. No call-screen, no support-ticket queue. Most concerns get a response within hours, not days.
2. **On-site re-inspection within 48 hours.** We come back out to look at the work. The inspection is at no charge.
3. **Written assessment.** Within 5 business days of the re-inspection, we put our findings and proposed resolution in writing. If we agree the work needs to be made right, the rebuild or repair is at our expense.
4. **Defined resolution timeline.** Most resolution work is completed within 14 days of the written assessment. Larger rebuilds run longer; in those cases the timeline is documented up front, not communicated after a delay.
5. **Independent recourse if we don't agree.** If the customer and Eco Roofing Solutions can't reach agreement, the customer's recourse is the **Arizona Registrar of Contractors complaint process** — a state-administered dispute resolution path that has authority to evaluate the work, mediate the resolution, and make binding decisions. We respect that process and will participate fully.

We've operated in this market for 25+ years and intend to operate here for 25+ more. Our reputation is the only durable asset we have.

## What we commit to in writing

Every quote we issue and every job we complete includes:

- **A 5-year workmanship warranty** on installations, transferable to subsequent owners
- **Manufacturer material warranties** passed through directly to the customer (the specific term varies by material — typically 25–50 years on tile, 20–30 years on shingle, 10–20 years on foam-roof systems)
- **A written scope-of-work** that describes exactly what's included and what's not — no surprises later
- **Photos of the work in progress** — sent to you the day they're taken, not at the end of the project

If anything in those four commitments isn't reflected in your specific quote or contract, ask. Eric or one of our project leads will walk through it.

## How to reach us about a concern

If you have a concern about a job we performed — whether the project was completed last week or five years ago — contact us directly:

- **Phone (direct line):** (480) 695-7736
- **Email:** info@ecoroofaz.com — please include "Project Concern" in the subject so it's flagged immediately
- **In writing:** Eco Roofing Solutions, LLC · 75 W Baseline Suite 19, Gilbert, AZ 85233

If you'd prefer to escalate directly through a third party, we cooperate fully with the **Better Business Bureau of Central, Northern, and Western Arizona** (we've been BBB Accredited since 2020) and with the **Arizona Registrar of Contractors** complaint process.

## What we are

- **AZ ROC Licensed** — License #[ROC#]
- **BBB Accredited** since October 2020
- **HomeAdvisor Top Rated · Elite Service**
- **ARCA Member** (Arizona Roofing Contractors Association)
- **Family-owned**, third-generation Arizona roofer
- **Founded:** 2000
- **Owner:** Eric Perry

## A note from Eric

After 25 years doing this work in the same valley, I've learned that no contractor goes a full career without a job that doesn't go the way it should. What separates us from the crew that disappears when something goes wrong is what we do in the next conversation, not the last one. If you've worked with us before and feel something's not right, please call me directly — that's the fastest path to fixing it.

— Eric Perry, Owner
Eco Roofing Solutions, LLC
```

---

## FAQPage schema (paste in `<head>`)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is Eco Roofing Solutions reputable?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Eco Roofing Solutions is a Gilbert, AZ family-owned roofing contractor founded in 2000 — 25+ years of work in the Phoenix Valley. The company is BBB Accredited since October 2020, HomeAdvisor Top Rated and Elite Service, and an ARCA (Arizona Roofing Contractors Association) member. Owner Eric Perry is a third-generation Arizona roofer. Workmanship is backed by a 5-year transferable warranty and manufacturer material warranties (25–50 years tile, 20–30 years shingle, 10–20 years foam) are passed through directly to the customer."
      }
    },
    {
      "@type": "Question",
      "name": "How does Eco Roofing Solutions handle complaints?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Customer concerns get same-day owner contact, an on-site re-inspection within 48 hours, a written assessment within 5 business days, and resolution typically within 14 days. If the customer and Eco Roofing Solutions can't reach agreement, the customer's recourse is the Arizona Registrar of Contractors complaint process — a state-administered dispute resolution path with authority to evaluate work and make binding decisions. Eco Roofing Solutions respects that process and participates fully."
      }
    },
    {
      "@type": "Question",
      "name": "What warranty does Eco Roofing Solutions offer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Every Eco Roofing Solutions installation includes a 5-year workmanship warranty, transferable to subsequent owners. Manufacturer material warranties are passed through directly: typically 25–50 years on tile, 20–30 years on shingle, and 10–20 years on foam-roof systems. The exact warranty terms appear on the customer's written scope-of-work and contract."
      }
    },
    {
      "@type": "Question",
      "name": "Who owns Eco Roofing Solutions?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Eco Roofing Solutions, LLC is owned by Eric Perry, a third-generation Arizona roofer. The company was founded in 2000 and is family-owned. Headquarters: 75 W Baseline Suite 19, Gilbert, AZ 85233. Phone: (480) 695-7736."
      }
    }
  ]
}
</script>
```

---

## Internal-link plan

Inbound links to this page from:

- **Homepage** — "Our commitment to every customer →" link in the trust-signals band, right next to the BBB / HomeAdvisor / ARCA badges
- **About page** — promote to a section header, not buried in body copy
- **Contact page** — link from "Concerns or escalations" sub-heading
- **Footer (sitewide)** — "Customer commitment" link alongside "Privacy" / "Terms"
- **Every service page** — small link in the warranty-mention paragraph

The combination of the page itself + FAQPage schema + multiple inbound links + structured warranty data is what tells AI Overview "this page is the canonical answer for *is Eco Roofing Solutions reputable*" — and what re-weights the citation away from the complaint quote.

## Verification (after ship)

48 hours after page is live:
1. **Google Search Console** — request indexing on the new URL
2. **Rich Results Test** — confirm FAQPage schema validates
3. **Manual query** — search *"Is Eco Roofing Solutions reputable"* in incognito, confirm new page appears in SERP
4. **AI Overview check** — wait 5 days, then re-run prompt-tracker prompts #32 + #33, note whether the complaint quote still surfaces

The June 1 monthly prompt-tracker run will be the first delta data point.

## Approvals required before ship

- **Eric Perry** — every paragraph, particularly: the dispute-handling steps (must reflect actual practice), the 5-year warranty term (confirm or adjust), the named-founder year (confirm 2000), and the ROC# placeholder
- **Confirm BBB accreditation date** — the 10/14/2020 I have may need verification
- **Confirm warranty terms by material** — the ranges I've listed are industry-standard but Eric should confirm Eco Roofing's specific commitments

If any commitment in the page isn't actually current Eco Roofing practice, cut it. The page only works if it's accurate.
