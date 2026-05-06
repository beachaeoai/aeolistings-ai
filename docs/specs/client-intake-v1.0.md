# Client Intake System — v1.0 Spec

*Approved 2026-05-05 · Aeolistings · Engineering hand-off doc*

## 1. Objective

Turn a signed Aeolistings sales contract into everything the implementation team needs to ship. Replace ad-hoc email back-and-forth with a sequenced, secure, client-friendly form.

**Success criteria:**
- Client completes intake in 35–60 minutes across 1–3 sessions
- Aeolistings receives a complete, structured asset/access package on submit
- Zero raw passwords stored or transmitted in plaintext
- Client can return and edit any field post-submit via the same magic link

---

## 2. Locked decisions

| Decision | Choice | Rationale |
|---|---|---|
| Intake URL pattern | `intake.aeolistings.ai/c/<token>` | Subdomain isolates the form from the marketing site; cleaner CSP/cookie scope |
| Auth model | Magic-link forever (no passwords ever) | Returning clients re-receive the link to their email; matches user expectation for "intake form" UX |
| Multi-client splitter | Skip in v1 | Not currently needed; defer until first agency-style client |
| Editable post-submit | Yes, full edit | Notifies Aeolistings via Slack on edit; same magic-link flow |
| Stack | Astro + Cloudflare Pages + D1 + KV + 1Password Business API | Mirrors existing aeolistings.ai stack |
| Calendar booking | Google Workspace Appointment Scheduling | Already paid for via Workspace; no extra vendor |
| PM hand-off target | Notion Business | Doubles as client wiki + PM; API integration enables intake-to-project automation |
| Credential storage | 1Password Business team vault, never in intake DB | Industry-standard; auditable; revocable |

---

## 3. The 10-step flow

```
CONTRACT SIGNED
       │
       ▼
Magic-link email → intake.aeolistings.ai/c/<token>
       │
       ▼
[ 0 ] Welcome
[ 1 ] Confirm scope
[ 2 ] Business identity        (auto-prefill from website + public records)
[ 3 ] Brand assets             (logo, colors, fonts, photography)
[ 4 ] Trust signals            (testimonials, projects, press, awards)
[ 5 ] Digital access           (credentials via secure paths only)
[ 6 ] Service area             (cities to build pages for)
[ 7 ] Voice & guardrails       (tone, "don't say this", warranty terms)
[ 8 ] Team & approvals         (contacts, approval workflow, named experts)
[ 9 ] Schedule & logistics     (kickoff via Google Appointment Scheduling)
[ 10 ] Review & submit
       │
       ▼
SUBMIT TRIGGERS:
  · Slack notification to Aeolistings
  · Notion project page auto-created from intake data
  · Asset files synced to Drive folder
  · Credential acks forwarded to 1Password Business
  · Calendar invite confirmed for kickoff
  · aeo-prompt-tracker-<slug> routine pre-staged (activated at kickoff)
```

Conditional logic: steps surface based on the client's actual scope (driven by `scope_flags` on the intake-token record). A client without social media management never sees the social-media access step.

---

## 4. Step-by-step wireframes

### Step 0 — Welcome

```
┌─────────────────────────────────────────────────────────────────────┐
│  aeolistings.ai                                  Step 0 of 10       │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Welcome, [Client First Name].                                      │
│                                                                     │
│  We're building [Business Name]'s [scope summary]. This intake     │
│  collects everything we need to start.                              │
│                                                                     │
│  ▸ Takes about 35–60 minutes total                                  │
│  ▸ Save anywhere — pick up later from the same email link           │
│  ▸ Skip a step if you don't have something handy                    │
│  ▸ We'll never ask for a raw password                               │
│                                                                     │
│  Your scope (from your signed contract):                            │
│     · [auto-pulled from contract data]                              │
│                                                                     │
│  [ Start the intake → ]                                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 1 — Confirm scope

```
┌─────────────────────────────────────────────────────────────────────┐
│  Step 1 of 10: Confirm scope                          [Save & exit] │
│                                                                     │
│  ☑ Website Creation & On-Site AEO Optimization                      │
│  ☑ GBP Optimization                                                 │
│  ☑ AEO Authority + Operations Retainer                              │
│  ☐ Social Media Foundation       (not in scope — show?  [+])       │
│  ☐ Social Media Management       (not in scope — show?  [+])       │
│                                                                     │
│  Anything missing or wrong?                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│                                       [ ← Back ]   [ Continue → ]   │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 2 — Business identity

Auto-prefilled from website crawl + public records (AZ ROC API, BBB lookup). Client confirms or edits.

Fields:
- Legal business name
- DBA
- Founded year
- Owner / founder name
- Phone (primary + optional secondary)
- Email (primary)
- Address
- Hours
- Licenses & accreditations: ROC# (with "Look up by business name" helper), bonded y/n, insured y/n, BBB accreditation date
- Industry associations (industry-aware checkboxes: NAHB / HBACA / NARI / ARCA for builders; IEC / NECA for electrical; etc.)
- Manufacturer certifications (industry-aware: GAF / Owens Corning / CertainTeed / Tesla / Qmerit / Generac / etc.)

### Step 3 — Brand assets

- Logo: SVG/AI/EPS preferred, PNG with transparency acceptable. Slots for color logo, white logo, favicon
- Brand colors: hex pickers for primary, accent, background. "I don't have brand colors — design something for me" toggle
- Fonts: name them or upload TTF/OTF. "Use designer's choice" toggle
- Photography: drag-drop multi-upload, max 200MB total, JPG/PNG. Categories: owner/team, truck/uniform, jobsite/before-after, office. "Arrange a photo shoot" alternative path

### Step 4 — Trust signals

- Testimonials: paste-form with name, project type, city, year, permission checkbox. "Connect existing review platforms" alternative (Houzz / HomeAdvisor / Yelp / BBB) for bulk import with permission
- Recent projects: project type, city, sqft/scope, timeline, year, budget range (with publishability toggle), photos, notes. Aim for 8–12 entries
- Press, podcasts, awards: title, URL, date

### Step 5 — Digital access (the credential step)

For each access need, four options:
1. **Add me as a delegate** (preferred — no credentials change hands)
2. **Share via 1Password Share / BitWarden Send / LastPass One-Time link** (secure password manager)
3. **Schedule a 15-min screen-share** to do it together
4. **Skip — I'll handle myself**

Categories:
- Domain registrar (auto-detected)
- Existing website (auto-detected platform: WordPress / Wix / Squarespace / Webflow / Custom)
- Google Business Profile (instructions to add Aeolistings email as Manager)
- Google Search Console / Google Analytics (email-based access)
- Social media: FB Editor, IG Manager, TikTok, LinkedIn, Houzz (where applicable)
- Hosting & email (auto-detected; default offer: migrate to Cloudflare Pages)

### Step 6 — Service area

Phoenix-metro auto-suggested checkbox list. Custom city add. Per selected city, free-text "anything we should know" field (HOA quirks, common project types, neighborhood specifics).

### Step 7 — Voice & guardrails

- Tone selector: 4 named options + custom text field
- "Three brands whose voice you admire" (3 inputs)
- "Don't say this" free-text
- Competitor sensitivities (3 inputs)
- Pricing publishability: starting-at / full-range / no-publish
- Warranty terms: workmanship duration, material policy, per-service specifics

### Step 8 — Team & approvals

- Primary contact: name, email, phone, role, preferred channel (email / text / phone / Slack / weekly call)
- Backup contact: same fields
- Approval workflow per deliverable type:
  - Website copy: assignee
  - Service/city pages: assignee
  - Blog posts: auto-publish / approve each / approve in monthly batches
  - GBP posts: auto-publish / approve each
  - Review responses: auto-publish / approve each
  - Social media posts: auto-publish / approve each / approve weekly batches
- Default approval turnaround: 2 business days / same-day
- Named experts (founder/lead) for author bylines: name, title, bio, headshot

### Step 9 — Schedule & logistics

- Kickoff call: Google Appointment Scheduling iframe embed
  - **Booking URL:** `https://calendar.app.google/Y6VXe3HC2qnqUBV19`
  - **Embed pattern:** wrap as iframe in Step 9; client books inline
  - Configured for: 30 min duration, 15 min buffer before/after, Mon–Fri AZ business hours, Google Meet auto-attached
- Project blackout dates: date-range picker, multi-add
- Weekly performance summary day: Friday / Monday / opt-out
- Quarterly strategy review preference: video call / written report / both
- Free-text "anything else"

### Step 10 — Review & submit

Show all steps with status (✅ complete / ⚠️ pending). Editable per section. Pending items are non-blocking — client can submit and Aeolistings follows up.

---

## 5. Auth & security model

### Magic links

- HMAC-SHA256-signed tokens, stored in Cloudflare KV
- 7-day expiry, single-use rotation on each save
- Tokens scoped to one intake record; rotating doesn't invalidate the record
- Email delivery via existing transactional path (Resend, already on stack)

### Credential handling — non-negotiable rules

- **Never** collected as plain text in form fields
- **Never** stored in the intake DB
- **Never** sent via plain email
- Allowed paths only:
  - 1Password Business team vault (preferred)
  - 1Password Share / BitWarden Send / LastPass One-Time links (single-use, scoped to specific Aeolistings team email)
  - Native platform delegation (GBP Manager add, WordPress Editor role, etc.)

### Data model — what gets stored

Intake DB stores **field values, not credentials**. Credential entries are metadata only:
```
{
  "credential_id": "domain_registrar",
  "method": "delegate_added" | "password_manager_share" | "screen_share" | "skip",
  "granted_at": "2026-05-05T13:24:00Z",
  "granted_via": "GoDaddy delegate add for ops@aeolistings.ai",
  "notes": "..."
}
```

Aeolistings team retrieves actual credentials from 1Password Business at the time of work, not from the intake DB.

---

## 6. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Astro | Mirrors aeolistings.ai |
| Hosting | Cloudflare Pages | Same as aeolistings.ai |
| DB | Cloudflare D1 (SQLite) | Intake records + form state |
| Token store | Cloudflare KV | Magic-link tokens with expiry |
| Email | Resend | Already integrated for contact form |
| File uploads | Cloudflare R2 | S3-compatible, sits well with Pages |
| Secrets | 1Password Business API | Credentials only (not form data) |
| PM integration | Notion API | Auto-create client page tree on submit |
| Calendar | Google Workspace Appointment Scheduling | iframe embed in Step 9 |
| Notifications | Slack webhook | Submit + edit notifications to ops channel |

---

## 7. Schema (Cloudflare D1)

```sql
CREATE TABLE intake_records (
  id              TEXT PRIMARY KEY,           -- ULID
  contract_id     TEXT NOT NULL,              -- references signed quote
  client_email    TEXT NOT NULL,
  client_name     TEXT NOT NULL,
  business_name   TEXT NOT NULL,
  scope_flags     TEXT NOT NULL,              -- JSON: {website: true, gbp: true, ...}
  status          TEXT NOT NULL,              -- 'in_progress' | 'submitted' | 'editing'
  current_step    INTEGER DEFAULT 0,
  data            TEXT NOT NULL DEFAULT '{}', -- JSON blob of all form data
  created_at      INTEGER NOT NULL,           -- unix
  updated_at      INTEGER NOT NULL,
  submitted_at    INTEGER                     -- null until submit
);

CREATE TABLE intake_files (
  id              TEXT PRIMARY KEY,
  intake_id       TEXT NOT NULL REFERENCES intake_records(id),
  category        TEXT NOT NULL,              -- 'logo' | 'photo' | 'project' | etc.
  filename        TEXT NOT NULL,
  r2_key          TEXT NOT NULL,
  mime_type       TEXT NOT NULL,
  size_bytes      INTEGER NOT NULL,
  uploaded_at     INTEGER NOT NULL
);

CREATE TABLE intake_credentials (
  id              TEXT PRIMARY KEY,
  intake_id       TEXT NOT NULL REFERENCES intake_records(id),
  credential_type TEXT NOT NULL,              -- 'domain_registrar' | 'gbp' | etc.
  method          TEXT NOT NULL,              -- 'delegate' | 'password_manager' | 'screen_share' | 'skip'
  status          TEXT NOT NULL,              -- 'pending' | 'granted' | 'verified'
  notes           TEXT,
  granted_at      INTEGER,
  verified_at     INTEGER
);

-- KV namespace `INTAKE_TOKENS` separately stores:
-- key:   token (hex of signed HMAC)
-- value: { intake_id, expires_at, single_use_consumed }
```

---

## 8. Integration points

### Submit handler (POST /api/intake/<id>/submit)

```
1. Validate all required-or-skipped fields are populated
2. Set status='submitted', submitted_at=now
3. Side effects (each runs as a Cloudflare Worker subtask):
   a. Slack webhook: "[Business Name] just submitted intake #<id>"
   b. Notion API: create client page tree from template, populate fields
   c. R2 → Drive sync: copy uploaded brand assets to client folder
   d. 1Password notify: post credential-method summary to ops vault
   e. Google Calendar: confirm kickoff slot already booked at Step 9
   f. Pre-stage prompt-tracker routine via RemoteTrigger API
4. Email confirmation to client with summary + edit link
5. Email to Aeolistings ops with deep link to Notion project
```

### Edit handler (PATCH /api/intake/<id>/<step>)

```
1. Verify magic-link token is valid and scoped to <id>
2. Apply patch to data JSON
3. If status is 'submitted', flip to 'editing' and notify Slack:
   "[Business Name] updated <step> — review at <link>"
4. After submit, auto-transition back to 'submitted' if no further edits in 24h
```

---

## 9. Notion template structure (auto-created on submit)

```
[Client Name] — Aeolistings Engagement
├── 📋 Engagement Overview          ← shared with client (read-only)
│   · Scope summary
│   · Timeline & milestones
│   · Latest tracker report (auto-updated monthly)
├── 🎯 Audit & Strategy
│   · Visibility audit PDF
│   · Pricing & contract terms
│   · Competitor set
├── 📝 Content Calendar             ← editable by Aeolistings team
│   · Blog posts (Notion database)
│   · GBP posts
│   · City pages roadmap
├── 🎨 Asset Library
│   · Logo files
│   · Photography (linked from Drive)
│   · Brand guidelines
├── 🔐 Access & Credentials         ← linked to 1Password
│   · NOT actual credentials — metadata only
├── 📈 Monthly Tracker Reports      ← auto-populated each month
│   · 2026-05 baseline
│   · 2026-06 (auto-added)
│   · ...
└── 💬 Client Communication
    · Meeting notes
    · Decision log
```

Template stored as a Notion template page; the API creates instances by duplicating the template and patching data fields.

---

## 10. Build order (recommended sprint plan)

| Sprint | Scope | Estimated effort |
|---|---|---|
| **1** | Magic-link auth + token system + KV setup | 3–4 days |
| **2** | Step 2 prefill (website crawl + public records lookup) | 4–5 days — most novel piece, derisk first |
| **3** | Steps 0–4 UI (welcome through trust signals) | 5–6 days |
| **4** | Steps 5–10 UI (digital access through review) | 5–6 days |
| **5** | Submit handler + Notion / Slack / R2 / 1Password integrations | 4–5 days |
| **6** | Post-submit edit flow + notification logic | 2–3 days |
| **7** | QA, polish, prefill edge cases, mobile responsive | 3–4 days |

**Total: ~3–4 weeks for v1** with one full-time engineer assuming an existing design system.

Auto-detect / prefill features at Step 2 are the riskiest piece — derisk in Sprint 2 before building the rest.

---

## 11. Out of scope for v1

- Multi-client / agency splitter (defer until first agency-style client)
- Mobile-native app (web responsive is enough)
- Integrations beyond Notion + Slack + Drive + 1Password (Asana, Salesforce, etc. — defer)
- Internal admin UI for Aeolistings to view/edit submitted intakes (use Notion + the magic link in v1; admin UI in v1.1 if needed)
- Bulk export of all intake data (handled via D1 query as needed)
- Multilingual support (English-only v1)

---

## 12. Cost summary

| Item | Cost (monthly) | Note |
|---|---|---|
| Notion Business | $20/user | New |
| 1Password Business | $7.99/user | New |
| Cloudflare Pages | $0 | Existing |
| Cloudflare D1 + KV + R2 | $0 at intake-form scale | Generous free tiers |
| Resend | $0 (existing free tier) | Existing |
| Google Workspace Appointment Scheduling | $0 | Included with Workspace |
| `intake.aeolistings.ai` subdomain | $0 | DNS record |
| Cal.com | — | **Skipped** |

**One user: ~$28/mo new spend. Three users: ~$84/mo.**

---

## 13. Provisioned infrastructure (filled as items come in)

### Notion
- **Master template page ID:** `8b0e273250f1492e91918e43e2e3ba66`
  (URL: https://www.notion.so/Client-Name-Aeolistings-Engagement-8b0e273250f1492e91918e43e2e3ba66)
- **Client Engagements parent page ID:** `3585fbf10b5e8057b035f7abb6cb5a7d`
  (URL: https://www.notion.so/Client-Engagements-3585fbf10b5e8057b035f7abb6cb5a7d)
- **Integration name:** Aeolistings Intake System (internal, in Aeolistings workspace)
- **Integration token:** stored in 1Password Business → *Aeolistings Client Credentials* vault
- **Integration must be connected to BOTH pages above** for the dev work to read the template and write new client pages

### Slack
- **Workspace:** Aeolistings
- **Ops notification channel:** `#client-onboarding` (intake submit + edit notifications)
- **Build coordination channel:** `#aeolistings-build`
- **Webhook URLs:** stored in 1Password Business → *Aeolistings Client Credentials* vault

### Google Workspace Appointment Scheduling
- **Booking URL:** `https://calendar.app.google/Y6VXe3HC2qnqUBV19`
- **Configured:** 30-min duration, 15 min buffer before/after, Mon–Fri AZ business hours, Google Meet auto-attached

### 1Password Business
- **Vault for client credentials:** *Aeolistings Client Credentials* (TBD)
- **Service account token:** TBD (stored in 1Password itself once created)
- **Vault UUID:** TBD

### Cloudflare
- **Account ID:** TBD
- **Pages project name:** TBD (suggested: `intake`)
- **D1 database ID:** TBD (suggested name: `intake-db`)
- **KV namespace ID:** TBD (suggested name: `INTAKE_TOKENS`)
- **R2 bucket name:** TBD (suggested: `aeolistings-intake-uploads`)
- **API token:** TBD (stored in 1Password)
- **Custom domain:** `intake.aeolistings.ai` (DNS to provision)

### Resend (existing)
- **API key:** existing, stored in 1Password
- **Verified sender:** `noreply@aeolistings.ai` or `intake@aeolistings.ai`

## 14. Open items remaining at hand-off

1. **Design system / UI kit** — does Aeolistings have one in the existing aeolistings.ai codebase, or does the dev start from Tailwind defaults? (Recommend reuse `src/styles/global.css` for color + type tokens)
2. **AZ ROC API access** for Step 2 prefill (or accept fallback to scraping the public ROC search page)

---

*This spec is the contract for v1. Subsequent iterations (v1.1+) build on this base.*
