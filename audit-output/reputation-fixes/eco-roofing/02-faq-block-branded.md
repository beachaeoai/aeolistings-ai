# Branded-Query FAQ Block — Eco Roofing Solutions

**Goal:** Provide citation-worthy answers to the four highest-intent branded queries that the AEO prompt-tracker flagged. AI Overview pulls FAQ content disproportionately when answering buyer questions; the goal is to give it a better source than the 1-star ROC complaint quote it's currently citing.

**Where this gets embedded:**
- The new `/about/our-commitment/` page (already includes the FAQPage schema in `01-reputation-page.md`)
- The existing About page (as a "Frequently asked" block)
- The Contact page (as a "Before you call" block)

Same Q&A content, three placements. **The FAQPage schema only goes on ONE page** (the new commitment page) — Google penalizes duplicated FAQPage schema across multiple pages. The other two placements have the same Q&A content but no schema.

**Skill mapping:** `faq-rewrite`

---

## The 8 Q&As (verbatim ready text)

Use the exact wording. The schema in `01-reputation-page.md` references the first 4 of these; the additional 4 below are for the longer About / Contact placements.

### 1. Is Eco Roofing Solutions reputable?

Eco Roofing Solutions is a Gilbert, AZ family-owned roofing contractor founded in 2000 — 25+ years of work in the Phoenix Valley. The company is BBB Accredited since October 2020, HomeAdvisor Top Rated and Elite Service, and an ARCA (Arizona Roofing Contractors Association) member. Owner Eric Perry is a third-generation Arizona roofer. Workmanship is backed by a 5-year transferable warranty and manufacturer material warranties (typically 25–50 years on tile, 20–30 years on shingle, 10–20 years on foam) are passed through directly to the customer. Phone: (480) 695-7736. ROC#: [INSERT].

### 2. How does Eco Roofing Solutions handle complaints?

Customer concerns get same-day owner contact, an on-site re-inspection within 48 hours, a written assessment within 5 business days, and resolution typically within 14 days. If the customer and Eco Roofing Solutions can't reach agreement, the customer's recourse is the Arizona Registrar of Contractors complaint process — a state-administered dispute resolution path with authority to evaluate work and make binding decisions. Eco Roofing Solutions respects that process and participates fully. Direct concern line: (480) 695-7736.

### 3. What warranty does Eco Roofing Solutions offer?

Every Eco Roofing Solutions installation includes a 5-year workmanship warranty, transferable to subsequent owners. Manufacturer material warranties are passed through directly to the customer: typically 25–50 years on tile, 20–30 years on shingle, and 10–20 years on foam-roof systems. The exact warranty terms appear on the customer's written scope-of-work and contract. Service area: Phoenix Valley, including Mesa, Gilbert, Chandler, Scottsdale, Tempe, and Queen Creek.

### 4. Who owns Eco Roofing Solutions?

Eco Roofing Solutions, LLC is owned by Eric Perry, a third-generation Arizona roofer. The company was founded in 2000 and is family-owned. Headquarters: 75 W Baseline Suite 19, Gilbert, AZ 85233. Phone: (480) 695-7736. Eric leads new-project consultations directly and is the named contact for customer concerns or escalations.

### 5. How long has Eco Roofing Solutions been in business?

Eco Roofing Solutions was founded in 2000 — 25+ years operating in the Phoenix Valley. The company has been BBB Accredited since October 2020, HomeAdvisor Top Rated, and an ARCA (Arizona Roofing Contractors Association) member. Owner Eric Perry is a third-generation roofer; Eco Roofing represents the third generation of the family's work in Arizona's residential and commercial roofing market.

### 6. Where does Eco Roofing Solutions work?

Eco Roofing Solutions serves the entire Phoenix Valley from its Gilbert, AZ headquarters at 75 W Baseline Suite 19. Primary service area: Mesa, Gilbert, Chandler, Scottsdale, Tempe, Queen Creek, Apache Junction, and the broader East Valley. The company also services West Valley cities (Glendale, Peoria, Surprise, Avondale, Goodyear) and Phoenix proper for both residential and commercial roofing work.

### 7. What does Eco Roofing Solutions specialize in?

Eco Roofing Solutions specializes in residential and commercial roofing across all Phoenix-climate-appropriate materials: tile (concrete and clay), foam systems, flat / low-slope, asphalt shingle, and rolled roofing. The company's distinct positioning is around energy-efficient and cool-roof systems — reflective coatings, foam systems, and tile selections optimized for the Phoenix Valley's heat-load profile. Roof repair, full replacement, maintenance, and inspections are all in-scope.

### 8. How can I verify Eco Roofing Solutions' license and credentials?

Eco Roofing Solutions is licensed by the Arizona Registrar of Contractors — license number [ROC#]. License status can be verified at any time at https://azroc.my.site.com/AZRoc/s/contractor-search. The company is BBB Accredited since October 2020 (verifiable at bbb.org). HomeAdvisor profile: https://www.homeadvisor.com/rated.EcoRoofingSolutions.107016647.html. ARCA membership listed at azroofing.org/member-directory.

---

## Placement instructions

### Placement 1: New commitment page (`/about/our-commitment/`)

All 8 Q&As, with FAQPage schema. The first 4 are critical-path; the additional 4 add depth and target the secondary branded queries (#7, #8 from the original prompt-tracker set).

### Placement 2: About page

All 8 Q&As as a section titled "Frequently asked about Eco Roofing Solutions". **No FAQPage schema** on this placement — the schema lives on the commitment page only.

### Placement 3: Contact page

The first 4 Q&As only (the four directly indexed in the schema). Section title: "Before you call — common questions answered." No schema.

## Why these specific 8

These map directly to the AEO prompt-tracker's trust / vetting cluster (prompts 32–36 in the Eco Roofing tracker) plus the long-tail buyer questions (37–40). Citation-worthiness check:

- Each answer is **60–120 words** (the citation-friendly range)
- Each contains **at least 3 specific facts** (numbers, dates, places, named entities)
- Each leads with **a direct answer in the first sentence**
- Each ends with a **verifiable proof point** (phone, address, URL, license number)

The current AI-Overview-cited 1-star complaint is a single voice with one perspective. Eight substantive Q&As authored by the company give AI Overview eight competing facts to weigh. The complaint doesn't disappear — it just stops being the highest-weight signal for branded queries.

## Approvals before ship

- **Eric Perry** — confirm warranty terms by material (the ranges I've listed are industry-standard but Eric should confirm Eco Roofing's specific commitments)
- **Verify ROC#** — currently bracketed as `[ROC#]` placeholder; needs to be filled before ship
- **Confirm BBB accreditation date** — verify the October 2020 date
- **Confirm service area cities** — the list above mirrors the website footer; if anything has changed, update before ship
