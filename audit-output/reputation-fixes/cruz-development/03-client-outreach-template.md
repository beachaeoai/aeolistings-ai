# Client Outreach — Reviews Mentioning Matthew by Name

**Goal:** Generate 5–10 Houzz / Google reviews from real Cruz clients that mention **Matthew Gallego by name** in the review text. This rebalances the citation corpus around the query *"Matthew Gallego custom home builder"* — currently the only sources Google AI Overview can find are the stale ZoomInfo entry plus the new bio page. Real client reviews mentioning him by name become a third source that is harder to outrank with stale data.

**Effort:** ~2 hours of Matthew's time to identify the recipient list. ~30 seconds per recipient to send. Expect 30–50% response rate over 14 days.

---

## How this works mechanically

When AI Overview composes an answer for *"Matthew Gallego custom home builder"*, it pulls from the strongest signals it can find about a person + builder + named context. Currently those signals are:

1. **The stale ZoomInfo entry** (says: PM at Starwood) — has the strongest entity-graph weight because it's been around the longest
2. **Cruz's website** (says: Founder at Cruz) — new entry, lower entity weight
3. **The Brad Leavitt podcast feature** (says: Founder at Cruz) — strong third-party signal but only one instance
4. **Real client reviews mentioning Matthew by name** — currently zero. **This is the gap.**

A handful of client reviews on Houzz and Google that say things like *"Matthew Gallego at Cruz Development built our home in Chandler..."* directly compete with ZoomInfo's "Matthew at Starwood" claim because they're recent, named, and contextually specific. Three to five of them is enough to move the citation needle on a 30-day curve.

## Step 1 — Identify the recipient list

Matthew should pull a list of **8–15 recent Cruz clients** (last 24 months) who:

- Had a positive experience and would be willing to leave a public review
- Are comfortable being named (first name + last initial OK)
- Worked directly with Matthew at some point during their build
- Have an active email address Cruz can reach

Prioritize:
- **Most recent:** the more recent, the more trustworthy the review reads
- **Most distinctive projects:** specific neighborhoods, notable scope, named cities
- **Existing strong relationships:** clients who would respond to a personal-feeling ask

Don't include clients whose project had problems, even if eventually resolved. The goal is volume of authentic positives, not damage control.

## Step 2 — Send the outreach (the message)

Two versions below. The **personal** version is what Matthew sends himself to the most direct relationships. The **company** version is what someone at Cruz sends on his behalf to the broader list. Both work; pick based on each recipient's comfort level.

### Version A — Personal (from Matthew, ~5 recipients)

**Subject:** A quick favor — and an update

```
[First name],

Quick ask — totally optional and no rush.

If you have 5 minutes and feel up to it, I'd be really grateful if you'd
leave a short review of your experience working with us on [their project
type — e.g., "the Chandler build" / "the kitchen remodel"] on either
Google or Houzz.

Anything from a sentence to a paragraph is more than fine. The biggest
help would be if you could mention me by name (Matthew Gallego) and the
city or neighborhood we worked in — that helps real future clients find
us when they're searching, and it helps the AI search tools that show
homebuyer answers in 2026 understand who we are.

Links:
  Google → [INSERT GOOGLE REVIEW SHORT LINK]
  Houzz  → [INSERT HOUZZ PROFILE LINK]

Thank you either way — and I hope [their home / project] is treating you
well. Drop me a line anytime if you ever need anything.

Matthew
Cruz Development
```

### Version B — Company (sent on Matthew's behalf, ~10 recipients)

**Subject:** Quick review request from Matthew at Cruz Development

```
Hi [First name],

[Sender name] from Cruz Development here. Matthew asked me to reach out
to a few of our recent clients with a small request.

If you'd be willing to leave a short review of your experience with Cruz
on either Google or Houzz, it would be a real help. Anything from a
sentence to a paragraph is more than enough.

If you can, mentioning Matthew by name (Matthew Gallego) and the city or
neighborhood your build was in would be especially helpful — it helps
future clients find us in search and AI search tools.

  Google → [INSERT GOOGLE REVIEW SHORT LINK]
  Houzz  → [INSERT HOUZZ PROFILE LINK]

No pressure either way, and thanks for considering it. Matthew sends
his best.

[Sender name]
Cruz Development
```

## Step 3 — Get the review links right

The links above need to be the **Google review-form short link** and the **Houzz review form**, not the general business profiles (which require the reviewer to find the review button themselves and lose 50%+ of conversions).

### Google review short link

1. Open Cruz's Google Business Profile in Google Maps
2. Click "Get more reviews" (or visit https://business.google.com/reviews/)
3. Copy the short link Google generates (format: `https://g.page/r/<placeId>/review`)
4. Use that exact link in the outreach

### Houzz review form

1. Go to https://www.houzz.com/professionals/general-contractors/cruz-development-pfvwus-pf~30544835
2. Find the "Write a Review" CTA
3. The direct form URL is what to use — typically `https://www.houzz.com/proWriteReview/<id>`

Test both links in an incognito browser before sending — confirm they go straight to the review form, not to the profile.

## Step 4 — Sequence the sends

Don't blast all 15 at once. Sequence in two waves:

- **Wave 1 (Day 1):** Send Version A to the 5 strongest relationships from Matthew personally
- **Wave 1 result check (Day 7):** count responses
- **Wave 2 (Day 8):** Send Version B to the remaining 10 from a Cruz team member

This avoids the "everyone reviewed in 24 hours" pattern that platforms flag as suspicious, and gives Matthew personal-touch credit on the closest relationships.

## Step 5 — Confirmation note

When a review lands, send a simple thank-you:

```
[First name] — saw the review come through. Really appreciate you
taking the time. Means a lot.

Matthew
```

That's it. Don't ask for more. Don't try to nudge them up to 5 stars. The thank-you is just for the relationship — and it's the move that produces the second review six months from now.

## What success looks like

By Day 30:
- 5+ new reviews mentioning Matthew by name on either Google or Houzz
- Citation share for prompt-tracker prompt #34 ("Matthew Gallego custom home builder") shifts from "ZoomInfo Starwood" to "Cruz Development founder" in the next monthly run
- The mis-attribution flag in the AEO tracker can be retired by Month 3

## What NOT to do

- **Don't offer anything in exchange for reviews** — discounts, gifts, future-project credit. Both Google and Houzz prohibit this and the consequence is removal of the review (and the account).
- **Don't write the review for them.** Templated reviews are flagged by both platforms and AI assistants both.
- **Don't ask for "5 stars"** — ask for "an honest review." The 5 stars come if the experience earned them.
- **Don't send to clients with unresolved issues.** That generates a 2-star review you didn't have before.
- **Don't re-ask if they don't respond.** One ask is the right ask.
