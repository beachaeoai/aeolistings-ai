# Notion Master Client Template — Paste Package

*Companion to `docs/specs/client-intake-v1.0.md` — paste-ready content for the master client template in Notion. Updated 2026-05-05.*

## How to use this file

For each page below, **copy the content block** between the `--- BEGIN ---` and `--- END ---` markers and paste it into the corresponding Notion page. Notion's paste handler converts markdown automatically.

After pasting:
1. Set the page **icon** (suggested in each section)
2. Convert `>` blockquotes to **callouts** if desired (`/callout` command, then paste the line in)
3. Create any **databases** noted at the end of each section using `/database` (full inline)
4. Set **sharing permissions** as noted (some pages are client-shared, most are internal-only)

For each new client:
1. Duplicate the entire master template
2. Rename the root page to the client name
3. Update the header callout fields (client name, scope summary, dates)
4. Connect the Notion integration to the duplicated page (so the API can populate it from the intake form)

---

## Page 1 of 7 — Root Template Page

**Icon:** 🤝
**Title:** `[Client Name] — Aeolistings Engagement`
**Sharing:** Internal team + read-only share with client (whole tree)

--- BEGIN ---
> 🤝 **Aeolistings client engagement workspace**
>
> This page is the home for everything related to this engagement. Internal team navigates from here; the client gets a read-only link to the **Engagement Overview** sub-page only.

# Quick links

- 📋 [Engagement Overview](#) — *client-shared, what they see*
- 🎯 [Audit & Strategy](#) — visibility audit, scope, competitors
- 📝 [Content Calendar](#) — blog posts, GBP posts, city-page roadmap
- 🎨 [Asset Library](#) — logo, photos, brand guidelines
- 🔐 [Access & Credentials](#) — metadata only; real credentials live in 1Password
- 📈 [Monthly Tracker Reports](#) — auto-populated each month from the prompt-tracker routine
- 💬 [Client Communication](#) — meeting notes, decision log

# Engagement summary

| Field | Value |
|---|---|
| Client | *[Business Name]* |
| Primary contact | *[Name, role, email, phone]* |
| Scope | *[Line items from contract]* |
| Engagement start date | *[YYYY-MM-DD]* |
| Routine ID | *[trig_xxx — links to claude.ai/code/routines]* |
| Active status | 🟢 Active / 🟡 Pause / ⚪ Wrapped |

# Internal links

- GitHub repo: `https://github.com/beachaeoai/aeolistings-ai`
- Audit-output for this client: `audit-output/aeo-tracking/[slug]/`
- 1Password vault: *Aeolistings Client Credentials* → folder *[Client Slug]*
- Slack channel for this client: *[#client-name or #client-onboarding for new]*
--- END ---

---

## Page 2 of 7 — Engagement Overview

**Icon:** 📋
**Title:** `Engagement Overview`
**Sharing:** **Client read-only** + internal team edit. This is the only page the client sees by default.

--- BEGIN ---
> 📋 **What's happening on your engagement, at a glance.** This page is updated continuously — bookmark it.

# Where we are

**Current phase:** *[Onboarding / Site build / GBP optimization / Retainer running / etc.]*
**Next milestone:** *[Description and target date]*
**Last updated:** *[Date]*

# What we're building

| Deliverable | Status | Target date | Notes |
|---|---|---|---|
| Website rebuild | 🟡 In progress | *[date]* | *[notes]* |
| GBP optimization | ⚪ Pending | *[date]* | *[notes]* |
| Authority Content Pack | ⚪ Pending | *[date]* | *[notes]* |
| Trust Signal Buildout | ⚪ Pending | *[date]* | *[notes]* |
| Monthly tracking program | 🟢 Live | Ongoing | First report: *[date]* |

# Latest monthly tracking report

*[Link to the most recent monthly report from the Monthly Tracker Reports section. Auto-updated by the Notion integration after each cron run.]*

# How to reach us

- **Day-to-day questions:** *[primary contact email + Slack channel if shared]*
- **Urgent / same-day:** *[phone or text number]*
- **Strategy / quarterly:** *[founder/lead name and email]*

# Approval queue

Anything currently waiting on your review:
- *[List of items, each with a link and a "review by" date]*
> If this list is empty, we're not blocked on you — we'll add to it as items come up.
--- END ---

---

## Page 3 of 7 — Audit & Strategy

**Icon:** 🎯
**Title:** `Audit & Strategy`
**Sharing:** Internal team only (don't share with client; some content is sensitive)

--- BEGIN ---
> 🎯 **The audit findings, scope, competitor set, and strategic direction for this engagement.**

# Visibility audit

- Full audit PDF: *[link to repo file at audit-output/Aeolistings-Audit-[Client].pdf]*
- One-pager: *[link]*
- GBP supplement: *[link]*
- Audit date: *[date]*

# Scope of services

| Line item | Investment | Status |
|---|---|---|
| *[Service]* | *[$X]* | 🟢 Delivered / 🟡 In progress / ⚪ Pending |

**One-time total:** *[$X with discount applied]*
**Recurring:** *[$X/mo]*

Reference: *audit-output/Aeolistings-Audit-[Client].pdf — Section 9*

# Three competitors

| Competitor | URL | Why they're benchmarked here |
|---|---|---|
| *[Name 1]* | *[URL]* | *[1 sentence]* |
| *[Name 2]* | *[URL]* | *[1 sentence]* |
| *[Name 3]* | *[URL]* | *[1 sentence]* |

# Critical findings to track over time

- *[Finding 1 — e.g., "Google AI mis-attributing founder to prior employer"]*
- *[Finding 2 — e.g., "Branded queries surfacing 1-star ROC complaint"]*
- *[Finding 3]*

# Strategic direction

*[2–4 sentences describing the brand's biggest opportunity and the order of operations for this engagement. Pulled from the audit's Strategic Notes section.]*

# Reputation-fix work (if applicable)

- *[Link to audit-output/reputation-fixes/[client]/ files]*
- Status: *[which drafts are shipped, which are pending client approval]*
--- END ---

---

## Page 4 of 7 — Content Calendar

**Icon:** 📝
**Title:** `Content Calendar`
**Sharing:** Internal team only

--- BEGIN ---
> 📝 **Editorial calendar for blog posts, GBP posts, city pages, and pillar content.**

# This month at a glance

- Blog posts shipped this month: *[#]*
- GBP posts shipped this month: *[#]*
- City pages in production: *[#]*
- Pillar pages in production: *[#]*

# How content gets queued

1. The monthly tracker report identifies citation gaps
2. Recommended content moves get added to the Blog Posts database below
3. Drafts are written by the AEO retainer team
4. Approval workflow: *[per Step 8 of intake — auto-publish / approve each / approve in batches]*
5. Published content gets cross-referenced back to the tracker prompt(s) it targets

# Databases on this page

(Create these manually using `/database` — schemas below)
--- END ---

### Database 4a: Blog Posts

Create with `/database` — full inline. Columns:

| Column name | Type | Options / details |
|---|---|---|
| Title | Title | *(default Notion title field)* |
| Status | Select | `Idea`, `Drafting`, `Internal review`, `Client review`, `Scheduled`, `Published`, `Cancelled` |
| Target prompt | Text | The buyer-intent prompt this post is written for |
| Word count target | Number | Default 800 |
| Author | Person or Text | Named expert (Eric, Matthew, etc.) |
| Draft link | URL | Link to draft document |
| Published URL | URL | Once live |
| Schedule date | Date | When to publish |
| Categories | Multi-select | `Cost`, `Process`, `Comparison`, `Style`, `Trust`, `Long-tail`, `Seasonal` |
| Linked monthly report | Relation | → Monthly Tracker Reports DB |

### Database 4b: GBP Posts

| Column name | Type | Options / details |
|---|---|---|
| Title | Title | |
| Status | Select | `Drafted`, `Scheduled`, `Posted`, `Archived` |
| Type | Select | `What's New`, `Offer`, `Event`, `Product` |
| Image | Files | Job-site or team photo |
| Body | Text | 100–300 words |
| CTA | Text | Button text |
| CTA URL | URL | Destination |
| Scheduled date | Date | |

### Database 4c: City pages roadmap

| Column name | Type | Options / details |
|---|---|---|
| City | Title | |
| Status | Select | `Researching`, `Drafting`, `Internal review`, `Live`, `Needs refresh` |
| URL slug | Text | e.g., `/services/tile-roofing/mesa/` |
| Word count target | Number | Default 700 |
| Neighborhoods covered | Multi-select | |
| ZIP codes covered | Multi-select | |
| Internal links from | Text | Which other pages link in |
| Live URL | URL | |
| Last refreshed | Date | |

---

## Page 5 of 7 — Asset Library

**Icon:** 🎨
**Title:** `Asset Library`
**Sharing:** Internal team only (could selectively share specific assets with client if needed)

--- BEGIN ---
> 🎨 **Brand assets and photography for this client.** Assets uploaded via the intake form sync here automatically; manual uploads also welcome.

# Brand fundamentals

- **Logo files (color):** *[link to file or Drive folder]*
- **Logo files (white/inverse):** *[link]*
- **Favicon:** *[link]*
- **Primary brand color:** `[#XXXXXX]`
- **Accent color:** `[#XXXXXX]`
- **Background color:** `[#XXXXXX]`
- **Heading font:** *[name]*
- **Body font:** *[name]*

# Photography

- **Owner / team headshots:** *[Drive folder link]*
- **Truck / uniform / vehicle:** *[Drive folder link]*
- **Job-site (before/during/after):** *[Drive folder link]*
- **Office / showroom:** *[Drive folder link]*
- **Photo shoot scheduled:** *[date or "completed"]*

# Voice & guardrails

(Pulled from intake form Step 7)

- **Tone:** *[from selector or custom description]*
- **Brands they admire:** *[3 names]*
- **Don't say this:** *[list]*
- **Competitor sensitivities:** *[3 names]*
- **Pricing publishability:** *[starting-at / full-range / no-publish]*

# Warranty terms

- Workmanship: *[duration, transferability]*
- Material policy: *[pass-through / specific]*
- Per-service specifics: *[as documented in intake]*

# Industry credentials

- **Licenses:** *[ROC#, others]*
- **Bonded/insured:** *[yes/no, terms]*
- **BBB:** *[accreditation date]*
- **Industry associations:** *[NAHB, HBACA, NARI, ARCA, IEC, NECA, etc.]*
- **Manufacturer certifications:** *[GAF, Tesla, Qmerit, Generac, etc.]*
--- END ---

---

## Page 6 of 7 — Access & Credentials

**Icon:** 🔐
**Title:** `Access & Credentials`
**Sharing:** Internal team only — sensitive

--- BEGIN ---
> 🔐 **Metadata only.** Actual credentials live in **1Password Business** under *Aeolistings Client Credentials → [Client Slug]*. This page tracks how access was granted, who has it, and when it was last rotated.

# 1Password vault link

*[Direct link to the 1Password vault folder for this client]*

# Access inventory

| System | How access was granted | Aeolistings team email used | Status | Last verified |
|---|---|---|---|---|
| Domain registrar | *[Delegate / 1P share / screen-share]* | *[email]* | 🟢 Active | *[date]* |
| Existing website (CMS) | *[method]* | *[email]* | 🟢 Active | *[date]* |
| Google Business Profile | Manager add | *[email]* | 🟢 Active | *[date]* |
| Google Search Console | Email-based | *[email]* | 🟢 Active | *[date]* |
| Google Analytics | Email-based | *[email]* | 🟢 Active | *[date]* |
| Cloudflare (if hosting) | Account-team add | *[email]* | 🟢 Active | *[date]* |
| Facebook Business Manager | Editor add | *[email]* | 🟢 Active | *[date]* |
| Instagram Business | Manager add | *[email]* | 🟢 Active | *[date]* |
| TikTok | *[method]* | *[email]* | 🟢 Active | *[date]* |
| Houzz (if applicable) | *[method]* | *[email]* | 🟢 Active | *[date]* |
| Email host | *[method]* | *[email]* | 🟢 Active | *[date]* |

# Access lifecycle

- **At engagement start:** access granted via the methods above
- **During engagement:** rotate any password-shared credentials every 90 days
- **At engagement end:** all access revoked within 5 business days; client confirms removal via email; this page archived

# Sensitive notes

*[Anything access-related the team needs to remember — e.g., "GBP is currently set as SAB, not storefront", "client wants notification before any DNS change", etc.]*
--- END ---

---

## Page 7 of 7 — Monthly Tracker Reports

**Icon:** 📈
**Title:** `Monthly Tracker Reports`
**Sharing:** Internal team only (the latest report's summary is surfaced on the Engagement Overview)

--- BEGIN ---
> 📈 **Output of the monthly recurring AEO prompt-tracker routine.** The cron fires on the 1st of each month at 6am AZ; the routine commits a new report to a branch, and the integration creates a corresponding entry in the database below.

# Routine config

- **Routine ID:** *[trig_xxx]*
- **Cron:** `0 13 1 * *` (1st of month, 6am AZ / 1pm UTC)
- **Model:** `claude-sonnet-4-6`
- **Manage at:** [claude.ai/code/routines](https://claude.ai/code/routines)

# Reports
--- END ---

### Database for Page 7: Monthly Tracker Reports

| Column name | Type | Options / details |
|---|---|---|
| Month | Title | Format: `2026-05` |
| Run date | Date | Actual date the routine fired |
| Status | Select | `Scheduled`, `Running`, `Complete`, `Errored` |
| Citation rate | Number | Format: percentage (% of prompts where target was cited) |
| Top recommendations | Text | Brief summary of the F. section from the report |
| Report file | URL | GitHub link to the markdown file |
| Notion mirror | URL | Link to the Notion page mirroring the report content (auto-created by integration) |
| Lead competitor citations | Multi-select | Names of competitors that surfaced most |
| Critical findings | Text | Anything flagged as needing immediate attention |

**Default rows to seed at template setup (so the table isn't empty when duplicated):**

| Month | Run date | Status |
|---|---|---|
| 2026-05 (baseline) | *[fill at duplicate time]* | Complete |

---

## Page Bonus — Client Communication

**Icon:** 💬
**Title:** `Client Communication`
**Sharing:** Internal team only

--- BEGIN ---
> 💬 **Meeting notes, decision log, and communication history with this client.**

# Meeting cadence

- **Kickoff call:** *[date, recording link if applicable]*
- **Weekly standup:** *[time, day — or "ad hoc"]*
- **Monthly check-in:** *[time, day]*
- **Quarterly strategy review:** *[next scheduled date]*

# Communication preferences

(From intake Step 8)
- Primary channel: *[email / text / phone / Slack / weekly call]*
- Approval turnaround: *[2 business days / same-day]*

# Notes / decisions databases below

(Create with `/database`)
--- END ---

### Database for Bonus Page: Meeting Notes

| Column name | Type | Options / details |
|---|---|---|
| Meeting | Title | e.g., "Kickoff call 2026-05-08" |
| Date | Date | |
| Type | Select | `Kickoff`, `Standup`, `Monthly check-in`, `Quarterly review`, `Ad hoc` |
| Attendees | Multi-select or Person | |
| Summary | Text | 2–3 sentences |
| Action items | Text | Linked to the action items database below |
| Recording link | URL | Optional |

### Database for Bonus Page: Decision Log

| Column name | Type | Options / details |
|---|---|---|
| Decision | Title | e.g., "Move GBP from storefront to SAB" |
| Date | Date | |
| Decided by | Person or Text | |
| Rationale | Text | Why this decision; context |
| Reversible? | Checkbox | Most decisions are; flag the ones that aren't |
| Linked meeting | Relation | → Meeting Notes DB |

---

## Setup checklist after pasting

After pasting all 7+1 pages, do these once:

- [ ] Set page icons (suggested above)
- [ ] Set page covers (optional — pick from Notion's gallery for visual consistency)
- [ ] Create the 6 databases noted (4 in Content Calendar, 1 in Monthly Tracker Reports, 2 in Client Communication)
- [ ] Set sharing permissions: Engagement Overview → "Anyone with the link can view" + invite client emails. Everything else: internal only.
- [ ] Connect the **Aeolistings Intake System** integration to the master template page (Settings → Connections → Add)
- [ ] In each duplicated client instance, replace `[Client Name]`, `[Business Name]`, `[Client Slug]` placeholders
- [ ] Test by duplicating the master template once for **Eco Roofing**, populating it, and confirming the structure feels right before duplicating for Cruz and Stag

## Updating this template later

The whole point of a master template is that you only have to make a structural change once. When you want to change something — add a new database column, change a field, etc.:

1. Edit the master template page (not a duplicated client instance)
2. The change applies to **future** duplicates only — existing client pages don't auto-update
3. For existing client pages that need the same change, edit them individually OR use the Notion API to bulk-update

A future version of this template can include a **changelog page** that tracks what's been added when, so client pages from older template versions can be retrofitted.
