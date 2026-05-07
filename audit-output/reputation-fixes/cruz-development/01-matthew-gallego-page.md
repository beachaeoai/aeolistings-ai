# Matthew Gallego — Named-Expert Page

**Target URL:** `/about/matthew-gallego/`
**Goal:** Outrank stale ZoomInfo entry for the query *"Matthew Gallego custom home builder"* with substantive, current, citation-worthy content. AI Overview should re-weight to this page within 30–60 days.

**Skill mapping:** `trust-signals` + `schema-rollout`

---

## Page content (markdown — ready to ship)

```markdown
# Matthew Gallego — Founder & Managing Partner, Cruz Development

**Years in luxury custom build:** 15+
**Founded Cruz Development:** 2018
**Operating regions:** Arizona (Chandler, Mesa, Glendale, Scottsdale, Paradise Valley) and Utah
**Industry recognition:** Featured guest on the Brad Leavitt Podcast (Episode 337) on reputation and relationship-driven luxury residential construction
**Approach:** Vertically-integrated build — no subcontracted general management, no middleman markup

## Background

Matthew Gallego founded Cruz Development in 2018 after gaining hands-on luxury residential experience with established custom home builders in California and Arizona. Before founding Cruz, his work centered on the project-management side of high-end custom homes — coordinating architects, structural engineers, interior designers, landscape teams, and trade partners on multi-million-dollar Arizona builds.

That operational background is the reason Cruz operates the way it does today: every trade discipline that matters to a luxury custom build — framing, finish carpentry, painting, millwork, cabinetry, roofing, outdoor living — runs through Cruz's own teams rather than being subcontracted to outside generals. The "all in house" position isn't a marketing line; it's the operational structure Matthew built the company around.

## What Matthew brings to a Cruz build

- **Direct project oversight on every Cruz home and remodel.** Matthew is on-site or in active communication with the lead site supervisor on every active project, every week. There is no "you'll never see the founder again after the contract is signed" moment.
- **Architect and designer relationships across Arizona and Utah.** Cruz works repeatedly with the same trusted design partners on lot evaluation, conceptual design, and engineered drawings — relationships that materially shorten timelines and reduce surprise.
- **Pre-construction discipline.** Matthew leads the pre-construction process himself: lot evaluation, soils, site planning, HOA / municipal coordination, allowance review. Most cost surprises in custom build come from skipped pre-construction; this is where Cruz's tenure shows up.
- **Construction-phase responsiveness.** A Matthew-direct contact line — phone or email — is part of every active client engagement. The escalation path is one step.

## Industry voice

Matthew was a featured guest on **The Brad Leavitt Podcast (Episode 337)** discussing the reputation and relationship dynamics that determine outcomes in high-end residential construction. The episode covers how he built Cruz's all-in-house model, the trade partnerships that make it work, and the buyer-side patterns that separate a good custom-home experience from a bad one.

[**Listen: Brad Leavitt Podcast Episode 337 — Matthew Gallego on relationship-driven custom build**](https://www.bradleavitt.com/podcast/matthew-gallego)

## Cruz Development at a glance

- **Founded:** 2018, Arizona
- **Founder:** Matthew Gallego
- **Other Managing Partners:** Robin Curry, Steven Curry
- **Service area:** Arizona (Chandler, Mesa, Glendale, Scottsdale, Paradise Valley) and Utah
- **Specialties:** Luxury custom homes, custom remodels, spec homes, full-trade vertically integrated build
- **Operating model:** All trades in-house — no general-contractor markup, no subcontracted project management
- **Phone:** (619) 916-1611
- **Address:** 3278 W Yellow Peak Dr, San Tan Valley, AZ 85144

## Contact Matthew directly

For new project inquiries — luxury custom build, custom remodel, or design-build consultation — Matthew is the right starting point.

[Schedule a consultation →](/schedule-a-consultation/)
```

---

## Person schema (JSON-LD — paste in `<head>` of the page)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://cruzdevaz.com/about/matthew-gallego/#matthew",
  "name": "Matthew Gallego",
  "jobTitle": "Founder & Managing Partner",
  "worksFor": {
    "@type": "Organization",
    "@id": "https://cruzdevaz.com/#org",
    "name": "Cruz Development",
    "url": "https://cruzdevaz.com"
  },
  "url": "https://cruzdevaz.com/about/matthew-gallego/",
  "image": "https://cruzdevaz.com/images/matthew-gallego.jpg",
  "description": "Founder and Managing Partner of Cruz Development, a vertically-integrated luxury custom home and remodeling builder serving Arizona and Utah since 2018.",
  "sameAs": [
    "https://www.bradleavitt.com/podcast/matthew-gallego",
    "https://www.instagram.com/cruzdevaz/",
    "https://www.houzz.com/professionals/general-contractors/cruz-development-pfvwus-pf~30544835"
  ],
  "knowsAbout": [
    "Luxury custom home construction",
    "Vertically-integrated residential build",
    "Custom remodeling Arizona",
    "Custom remodeling Utah",
    "Pre-construction project management"
  ]
}
</script>
```

---

## Internal link plan

Add inbound links to the new page from:

- **Homepage** — replace the existing thin "About the team" mention with a direct link: *"Matthew Gallego, founder, leads every Cruz build →"*
- **About page** — promote Matthew's bio block to a link: *"More on Matthew →"*
- **Every blog post** — author byline links to `/about/matthew-gallego/`
- **Schedule a Consultation page** — *"Want to talk to Matthew directly? Schedule below."*
- **Footer** — *"Founded by Matthew Gallego in 2018"* with link

The Person schema combined with multiple in-body links plus the `sameAs` array (linking the podcast, Instagram, and Houzz profile) is what tells Google's Knowledge Graph that this is the canonical "Matthew Gallego" entity for builder queries — and what should reweight the citation away from the stale ZoomInfo Starwood reference.

## Photo brief

A real headshot is non-negotiable — stock photos defeat the purpose. Brief for Matthew (or whoever's coordinating):

- 1200×1200 minimum, square crop
- Natural light, neutral background, business-casual
- File name: `matthew-gallego-cruz-development.jpg` (descriptive, AI-readable)
- Save at: `/images/matthew-gallego.jpg` to match the schema reference
- Geotag if possible (Phoenix-area coordinates)

If Matthew is camera-shy, a job-site photo (Matthew on a real Cruz build, with a finished home in the background) reads as more credible than a studio headshot anyway.

## Verification (after ship)

48 hours after the page is live:
1. **Google Search Console:** request indexing on `/about/matthew-gallego/`
2. **Rich Results Test:** confirm the Person schema validates at https://search.google.com/test/rich-results
3. **Manual query:** search *"Matthew Gallego custom home builder"* and confirm the new page appears in the SERP
4. **AI Overview check:** wait 5 days, then re-run prompt #34 in the Cruz prompt-tracker set — note whether the Starwood reference still appears

The next monthly prompt-tracker run (June 1) will track this delta automatically.
