# Aeolistings Client Intake — Application

The intake form clients fill out after signing a sales contract. Built per [`docs/specs/client-intake-v1.0.md`](../docs/specs/client-intake-v1.0.md).

**Status:** Sprint 1 shipped · Production deploy: `https://aeolistings.ai/intake/` (path-based; see spec §2 for the URL-pattern revision)

## Quick reference

| Item | Value |
|---|---|
| Production URL | `https://aeolistings.ai/intake/c/<token>` (path-based via Worker Route — see spec §2) |
| Cloudflare Pages project | `aeolistings-intake` |
| GitHub repo | `beachaeoai/aeolistings-ai` (this monorepo) |
| Spec | [`docs/specs/client-intake-v1.0.md`](../docs/specs/client-intake-v1.0.md) |
| Notion template content | [`docs/specs/notion-master-template-content.md`](../docs/specs/notion-master-template-content.md) |

## Stack

- **Astro 4+** with the Cloudflare adapter
- **Cloudflare Pages** (hosting) + **D1** (intake records DB) + **KV** (magic-link tokens) + **R2** (file uploads)
- **TypeScript** throughout
- **Tailwind** for styling (mirrors aeolistings.ai design tokens)
- **Resend** for transactional email (magic links)

External integrations:
- **Notion API** — auto-creates client page tree on submit
- **1Password Connect** — credential metadata logging
- **Slack webhooks** — notifications on submit + edit

## Local dev — first-time setup

Once per machine:

```bash
# From repo root, change into the intake app
cd intake

# Install dependencies (uses npm; pnpm or bun also fine)
npm install

# Copy the secrets template and fill in real values from 1Password
cp .dev.vars.example .dev.vars
# Edit .dev.vars and replace each xxx with the real value
# - NOTION_INTEGRATION_TOKEN: from 1Password vault → "Notion Integration Token — Intake System"
# - ONEPASSWORD_SERVICE_ACCOUNT_TOKEN: from 1Password → "1Password Service Account Token"
# - SLACK_WEBHOOK_INTAKE_OPS / SLACK_WEBHOOK_BUILD: from 1Password → "Slack Webhooks — Intake System"
# - RESEND_API_KEY: existing aeolistings.ai contact-form key from 1Password
# - HMAC_SIGNING_KEY: generate fresh with `openssl rand -hex 32`

# Apply the local D1 schema
npx wrangler d1 migrations apply intake-db --local

# Start the dev server (Wrangler emulates Cloudflare bindings locally)
npm run dev
```

Local server runs at `http://localhost:4321`.

## Local dev — subsequent sessions

```bash
cd intake
npm run dev
```

That's it. Wrangler handles binding emulation, and `.dev.vars` provides the secrets.

## Database operations

### Create a new migration

```bash
# Edit migrations/000X_description.sql with the SQL changes
# Then apply locally first to validate
npx wrangler d1 migrations apply intake-db --local

# When ready, apply to production
npx wrangler d1 migrations apply intake-db --remote
```

### Inspect data locally

```bash
npx wrangler d1 execute intake-db --local --command "SELECT * FROM intake_records LIMIT 10"
```

### Inspect data in production

```bash
npx wrangler d1 execute intake-db --remote --command "SELECT * FROM intake_records WHERE status = 'submitted'"
```

## Deploy

The intake app deploys as a **Workers Static Assets** worker named `intake` (matching the marketing site at the repo root, which uses the same model). Deploys are driven by [`.github/workflows/intake-deploy.yml`](../.github/workflows/intake-deploy.yml). Any push that touches `intake/**` runs tests + build. Push to `main` also applies pending D1 migrations remotely, runs `wrangler deploy`, pushes the HMAC secret to the worker, ensures the `aeolistings.ai/intake/*` Worker Route points at the worker, then probes `/intake/api/health` on the production URL.

**Production:** `https://aeolistings.ai/intake/` — served by Worker Route `aeolistings.ai/intake/*` → `intake` (the Worker Route outranks the marketing site's hostname-level Custom Domain on `aeolistings.ai/*`).

**Direct worker URL:** `https://intake.beacho1830.workers.dev/intake/api/health` — used in the smoke test as a fallback signal that doesn't depend on zone-level routing.

**Why Workers Static Assets and not Pages?** Cloudflare Pages projects can't be targeted by Worker Routes — they're only addressable by Workers Custom Domains (hostname-level). Path-based routing requires a real Workers Script in the regular Workers namespace. Both the intake and marketing site now use the same deploy model.

### One-time setup

Configure these in `Settings → Secrets and variables → Actions` for the repo:

| Kind | Name | Value |
|---|---|---|
| Variable | `CLOUDFLARE_ACCOUNT_ID` | `f700964246b5d61966399989f1910a56` (per spec §13) |
| Secret | `CLOUDFLARE_API_TOKEN` | Created in Cloudflare → My Profile → API Tokens. Scopes: Account-level Workers Scripts:Edit + D1:Edit + KV:Edit + R2:Edit; Zone-level `aeolistings.ai`: Zone:Read + DNS:Edit + (optionally) Workers Routes:Edit |
| Secret | `INTAKE_HMAC_SIGNING_KEY` | `openssl rand -hex 32`. **Different value from local `.dev.vars`** — store this one in 1Password Business → *Aeolistings Client Credentials* vault as "Intake System HMAC Signing Key — Prod" |

The first deploy creates the `intake` worker automatically (`wrangler deploy` upserts).

If the deploy token lacks `Workers Routes:Edit`, the workflow's route-management step warns and exits zero, leaving the route as-is. The route only needs to be set up once. Provision/update it manually:

```bash
# Custom Token: Zone → Workers Routes → Edit on aeolistings.ai
export ROUTES_TOKEN='<paste>'
ZONE_ID='0c19359079073ed4a0624d55eff48501'

# Find any existing route at the pattern
ROUTE_ID=$(curl -sS "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/routes" \
  -H "Authorization: Bearer ${ROUTES_TOKEN}" \
  | jq -r '.result[]? | select(.pattern == "aeolistings.ai/intake/*") | .id')

if [ -n "$ROUTE_ID" ]; then
  # Update existing → point at the `intake` worker
  curl -sS -X PUT \
    "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/routes/${ROUTE_ID}" \
    -H "Authorization: Bearer ${ROUTES_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"pattern":"aeolistings.ai/intake/*","script":"intake"}' | jq
else
  # Create new
  curl -sS -X POST \
    "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/routes" \
    -H "Authorization: Bearer ${ROUTES_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"pattern":"aeolistings.ai/intake/*","script":"intake"}' | jq
fi
# Delete the one-shot token afterward.
```

### Ad-hoc local deploy (rare)

```bash
npm run build
CLOUDFLARE_API_TOKEN=… npx wrangler deploy --config ./wrangler.jsonc
```

## Project structure

```
intake/
├── README.md                       ← you are here
├── package.json                    ← deps + scripts
├── astro.config.mjs                ← Astro + Cloudflare adapter (base: '/intake')
├── wrangler.jsonc                  ← Workers Static Assets config + bindings
├── .dev.vars.example               ← secret template (real values in .dev.vars, gitignored)
├── .gitignore                      ← ignore .dev.vars, node_modules, dist, .wrangler
├── tsconfig.json                   ← TypeScript config
├── src/
│   ├── env.d.ts                    ← TypeScript types for Cloudflare bindings
│   ├── layouts/
│   │   └── Page.astro              ← shared chrome (head, main, footer) + brand tokens
│   ├── components/intake/
│   │   └── UploadSlot.astro        ← native file-input wrapped to match the form (Sprint 3) ✅
│   │
│   ├── pages/
│   │   ├── index.astro             ← bare-domain landing
│   │   ├── 404.astro               ← branded fallback
│   │   ├── c/[token].astro         ← magic-link form (Sprints 3 + 4 — all 10 steps wired) ✅
│   │   └── api/
│   │       ├── health.ts           ← health check endpoint
│   │       └── intake/
│   │           ├── create.ts       ← POST: admin-keyed; mints intake + magic link
│   │           ├── [token].ts      ← GET resume / POST save (rotates token)
│   │           └── [token]/
│   │               ├── prefill.ts  ← POST: Step 2 auto-prefill (Sprint 2) ✅
│   │               ├── upload.ts   ← POST: brand-asset / photo upload to R2 (Sprint 3) ✅
│   │               └── credentials.ts ← POST: Step 5 credential metadata upsert (Sprint 4) ✅
│   ├── lib/
│   │   ├── tokens.ts               ← HMAC magic-link helpers (Sprint 1) ✅
│   │   ├── intake.ts               ← D1 create / get / patch helpers (Sprint 1) ✅
│   │   ├── prefill.ts              ← Step 2 prefill: crawl + AZ ROC + BBB + KV cache (Sprint 2) ✅
│   │   ├── files.ts                ← R2 upload helpers + intake_files writes (Sprint 3) ✅
│   │   ├── step-state.ts           ← Per-step initial-state for all 10 steps (Sprints 3 + 4) ✅
│   │   ├── credentials.ts          ← intake_credentials upsert helpers (Sprint 4) ✅
│   │   ├── notion.ts               ← Notion API client wrapper (Sprint 5)
│   │   ├── slack.ts                ← Slack webhook poster (Sprint 5)
│   │   └── 1password.ts            ← 1Password Connect client (Sprint 5)
│   └── styles/
│       ├── global.css              ← brand tokens mirroring aeolistings.ai
│       └── form.css                ← intake-form layout/components (Sprints 3 + 4) ✅
├── tests/
│   ├── tokens.test.ts              ← 20 unit tests for the four token primitives
│   ├── intake-flow.test.ts         ← 11 route-handler integration tests
│   ├── prefill.test.ts             ← 19 tests covering JSON-LD / scrape / ROC / BBB / cache
│   ├── step-state.test.ts          ← 14 tests for derive-initial-state + applyPrefill (Sprint 3)
│   ├── step-flow.test.ts           ← 21 tests: PATCH placement (steps 1–10) + refresh + prefill + credentials endpoint (Sprints 3 + 4)
│   ├── upload.test.ts              ←  7 tests for the R2 upload endpoint (Sprint 3)
│   └── helpers/                    ← in-memory KV + D1 (records / files / credentials) + R2 fakes
└── migrations/
    └── 0001_initial.sql            ← D1 schema from spec section 7
```

## Sprint plan

Per spec section 10:

- ✅ **Sprint 1** — Magic-link auth + token system + KV setup (delivered: 31/31 tests, GitHub Actions deploy workflow, branded landing/404/`/c/<token>` placeholder)
- ✅ **Sprint 2** — Step 2 prefill: website crawl (JSON-LD + scrape fallback), AZ ROC + BBB lookups, 24h KV cache, `POST /api/intake/[token]/prefill` (50/50 tests)
- ✅ **Sprint 3** — Steps 0–4 UI: welcome, confirm scope, business identity (with auto-prefill + per-field provenance), brand assets (logo + photo upload to R2), trust signals (testimonials/projects/press repeating cards). `POST /api/intake/[token]/upload` endpoint added; client-side state machine PATCHes the API on continue, rotates the token, and updates the URL via `history.replaceState` (79/79 tests, +29 for Sprint 3)
- ✅ **Sprint 4** — Steps 5–10 UI: digital access (credential metadata via `intake_credentials`, never raw passwords), service area (Phoenix-metro checklist + custom cities), voice & guardrails, team & approvals, schedule (Google Appointment Scheduling iframe + blackouts), review & submit (per-section read-only summary with edit links + Sprint-5-stub success state). `POST /api/intake/[token]/credentials` endpoint added; `collectStep5..collectStep10` follow the Sprint-3 pattern (92/92 tests, +13 for Sprint 4)
- ✅ **Sprint 5** — Submit handler + integrations. `POST /api/intake/[token]/submit` flips `status='submitted'`, stamps `submitted_at`, then fires five side-effects independently: Slack `#client-onboarding` notification, Notion child page under "Client Engagements" populated with the engagement summary, 1Password Secure Note with the credential-method summary, R2 → Drive manifest built from `intake_files`, and Resend confirmations to client + ops. Each failure is captured as a `warnings[]` entry; partial failure never 500s the request. The Step-10 client UI replaces its stub banner with a real "Submitted ✓" state (or a partial-failure banner listing pending integrations). New lib modules: `email.ts` + `drive-sync.ts`; `notion.ts` / `slack.ts` / `1password.ts` filled from their stubs; `markIntakeSubmitted` + `listIntakeFiles` added to `lib/intake.ts`. 103/103 tests, +11 for Sprint 5.
- ✅ **Sprint 6** — Post-submit edit flow. A save against a `status='submitted'` row flips it to `'editing'` in one UPDATE (`applyEditToSubmitted` in `lib/intake.ts`) and Slack-notifies ops via `notifyIntakeEdited`. Subsequent saves while still `'editing'` do NOT re-notify. The resume `GET /api/intake/[token]` lazy-reconciles a row that's been `'editing'` >24h back to `'submitted'` — no cron needed. The form UI now renders a persistent status banner above all steps (hidden when `status='in_progress'`, shows "Submitted ✓" or "Editing…" otherwise) and hides the Step-10 Submit button once submitted. Notion / 1Password / Resend do NOT re-fire on edit — only Slack notifies. 110/110 tests, +7 for Sprint 6.
- **Sprint 7** — Magic-link auto-recover (P1), prefill edge cases, mobile responsive, QA polish (3–4 days)

For Claude-in-Code dev sessions, each sprint is roughly **one focused session**.

## Lessons from Sprint 6 (read before Sprint 7+)

1. **Save endpoint now has two code paths: regular save and edit-save.** `POST /api/intake/[token]` fetches the existing record up front and branches on `status`. If `'submitted'`, it calls `applyEditToSubmitted` (one UPDATE that includes the status flip) and then `notifyIntakeEdited`. Otherwise it falls through to the original `updateIntakeData`. The branch happens *before* the rotate-token + response, so the new token returned with the response is already tied to the freshly-edited (status='editing') row. Don't separate the status flip from the data update into two UPDATEs — atomicity matters here.
2. **Lazy reconcile lives in `reconcileEditingTimeout`, called from `GET /api/intake/[token]`.** No cron worker. A row that's been `'editing'` for >24h since its `updated_at` flips back to `'submitted'` on the next read (or save's pre-read). The flip persists via a status-only UPDATE that touches `updated_at` as well — keeping the original `submitted_at` intact. Tests use `env._db.records.set(intake_id, {...row, updated_at: row.updated_at - 25 * 3600})` to fast-forward; in prod, real wall-clock does the same job.
3. **Slack only fires on the `submitted → editing` transition, not on every edit save.** The second + third edit (while still `'editing'`) don't notify because `before.status === 'submitted'` is false at that point. This matches user expectations — they tweak a field, click Continue, and don't expect three Slack pings for three keystrokes. The first transition is the meaningful signal.
4. **Slack down does not 500 the save** — same partial-failure pattern as Sprint 5. The handler wraps `notifyIntakeEdited` in try/catch and returns `warnings: [{step: 'slack', error}]`. The data has already been persisted by that point; failing here would lose the save, not just the notification.
5. **The status banner is a single element with `innerHTML` swap, not two hidden siblings.** Two siblings worked for Sprint 5's success/partial banners because they were mutually exclusive Step-10-only states with very different markup. Sprint 6's banner is global (above every step) and only ever shows one of three states (in_progress=hidden, submitted, editing); innerHTML keeps the DOM clean and the toggle in one place. `refreshStatusBanner()` is the single entry point — call it after init, after submit, and after every save where status might have changed.
6. **`describeEditedStep` is intentionally dumb.** It reports the top-level keys of `patch.data` (e.g. "step7") or falls back to `step N` from `current_step`. The Slack message says "Stag Electric updated step7" which is good enough for ops to know which area to review. Don't try to humanize the step name here — that's UI territory; the Slack channel readers know the schema.
7. **The form UI reads `body.intake.status` from the save response to update `state.status` in-place.** This is the first time the client mirrors a server-side status change without a reload. Sprint 7's mobile-responsive pass should be careful not to break this — if the client UI ever skips reading the response (e.g. for an "optimistic" navigation), the editing banner will lag a save behind.
8. **Sprint 6 does NOT re-fire Notion / 1Password / Resend on edit.** Per spec §8, only Slack notifies on edit; the Sprint-5 side effects are submit-only. If a future requirement adds "re-sync Notion on edit," do it as a separate explicit endpoint (e.g. `POST /api/intake/[token]/resync`) rather than tangling it into the save path — the partial-failure surface gets ugly quickly when multiple integrations have to coordinate.

## Lessons from Sprint 5 (read before Sprint 6+)

1. **The submit endpoint is partial-failure tolerant by design — and the response shape encodes that.** `POST /api/intake/[token]/submit` returns 200 with `warnings: [{step, error}]` for any side-effect that fails. The client UI renders `[data-step10-submitted]` only when `warnings` is empty; otherwise it renders `[data-step10-partial]` with the comma-separated step names. Don't add a top-level error short-circuit — partial means the *intake row* is `status='submitted'`, just that one or more downstreams haven't acknowledged. Ops gets an email summary regardless (modulo email itself failing).
2. **Side effects fire sequentially, not in parallel.** A `Promise.allSettled` would be slightly faster on the happy path, but the warnings array needs deterministic ordering so the test suite and the Slack message stay stable. The five steps run in this order: Notion → 1Password → Slack → email-client → email-ops. Slack runs *after* Notion so the Slack message can include the Notion URL when Notion succeeded. The drive-asset manifest is built before any of them because its result feeds Notion.
3. **Slack notifies even when Notion failed** — but `notion_url` is omitted from the Slack message in that case. The `pending_items` list in the Slack body comes from the warnings array accumulated so far, which is why Slack is ordered third (after Notion + 1Password). Don't refactor this ordering without updating the Slack-warning assertions in `tests/submit.test.ts`.
4. **Double-submit returns 409, not 200.** The side effects are not idempotent (a second submit would create a second Notion page, a second 1Password note, etc.). The endpoint checks `existing.status === 'submitted' && existing.submitted_at`. Sprint 6's edit flow flips status back to `'editing'` on a save against a submitted intake — that doesn't allow re-submit; clients edit-in-place and ops see a Slack edit-notification.
5. **Reads from D1 tables, not from `data.step5` / `data.step3`.** The intake data JSON is a mirror; the authoritative source for credentials is `intake_credentials`, and for files is `intake_files`. The submit handler reads both directly via `listCredentials` + `listIntakeFiles`. If you ever drift the JSON mirror from the table, prefer the table — that's what Sprint 4's `persistCredentialsToTable` and Sprint 3's upload endpoint write to.
6. **Notion's REST API has no "duplicate page" endpoint.** Sprint 5 chose to write the engagement summary as a flat child page under `NOTION_PARENT_PAGE_ID` rather than recursively walk + recreate the master template's block tree. The master template still lives at `NOTION_TEMPLATE_PAGE_ID` (linked in the new page's "Next steps" block) for ops to expand manually. If a future sprint adds full tree duplication, do it as a separate `duplicateTemplateBlocks(env, source_page_id, dest_page_id)` helper — keep `createClientPageTree` as the surface the submit handler calls so partial-failure semantics don't change.
7. **`@notionhq/client` import was removed.** The stub imported `Client` from `@notionhq/client`, but Sprint 5 uses direct fetch calls (one `POST /pages`, that's it). The SDK is still in package.json — it's not pulling in node-only deps in the way `ulid` did, but a single fetch keeps the Workers bundle smaller and matches the pattern of `resend` (also direct fetch, not the SDK). Remove `@notionhq/client` from deps in a follow-up cleanup if no other surface comes to need it.
8. **All five integrations accept an optional `env.fetcher` override.** Mirrors the Sprint-2 prefill pattern so tests stay hermetic (`makeFetcher([{match, respond}, ...])`). Production uses `globalThis.fetch`. Don't introduce a separate "live" vs "test" path — the override is the only thing the test fixture flips.
9. **Local dev needs `.dev.vars` for the dev server to start cleanly.** Without it, secrets like `HMAC_SIGNING_KEY` are undefined and token verification 401s on every request. The README's "first-time setup" already mentions copying `.dev.vars.example`; future Claude should do that on a fresh checkout rather than try to bypass the missing secret. Placeholder values (e.g. `re_dev_placeholder`) are fine for UI verification — they just cause integrations to fail with a captured warning, which is exactly the partial-failure path you want to exercise anyway.

## Lessons from Sprint 4 (read before Sprint 5+)

1. **Step 5 writes are dual-channel: `intake_credentials` table + `data.step5.credentials` JSON.** The table is the source of truth (Sprint 5's 1Password sync reads it directly); the JSON mirror exists so Step 10's review summary can render without a second query and so the form can show what's already been chosen across saves. The `POST /api/intake/[token]/credentials` endpoint is **upsert-by-(intake_id, credential_type)** so re-clicking Continue doesn't create duplicate rows. The endpoint also rejects notes that pattern-match a leaked credential (`password:`, `api_key=`, etc.) — defense-in-depth for a column that should never see secrets per spec §5.
2. **The `submit` button is a stub for Sprint 5.** It POSTs `current_step=10` + `data.step10.submitted_at` and shows a success banner; integrations (Notion / Slack / R2 → Drive / 1Password) are deliberately not wired. The intake row has `status='in_progress'` until Sprint 5's submit handler flips it. Don't conflate "client clicked Submit" with "system processed Submit" — they will diverge briefly.
3. **The Google Appointment Scheduling iframe URL comes from `env.APPOINTMENT_SCHEDULING_URL`**, not hardcoded. `wrangler.jsonc` already wires it; the renderer falls back to a "we'll email you a direct link" message if it's missing so dev environments without the var don't break. Cloudflare's preview/prod difference: the iframe loads fine on the real domain, but some local dev setups block the third-party frame — verify on the live URL, not just `astro dev`.
4. **Step 6 has two list types in one section: built-in Phoenix-metro checkboxes (static markup) + custom cities (rendered dynamically).** The static built-ins don't need an input handler since `collectStep6` reads from the DOM at save time. Custom cities DO get input handlers because `add-custom-city` re-renders the list and would otherwise lose typed values. If Sprint 5+ adds another section with mixed static/dynamic, follow the same split rather than unifying — the static branch is much simpler.
5. **`renderReview()` reads from in-memory `state` only, never from D1.** It's called on init and after Step 9 → 10. Edits in earlier steps update `state` via collector functions before any save, so the review reflects unsaved changes too — this is intentional and matches user expectations ("I just typed it, I should see it"). Sprint 5's submit handler should re-fetch the record from D1 server-side rather than trusting the Step-10 state shape.
6. **`fake-d1-extended.ts` now also handles `intake_credentials`** (INSERT/UPDATE/SELECT-first/SELECT-all). It now covers all three tables — keep adding to it instead of spawning yet another fake. The third helper would have tipped this into "actually unify the fakes," but at three tables it's still clearer to read top-to-bottom.

## Lessons from Sprint 3 (read before Sprint 4+)

1. **The form is a single `[token].astro` page that renders every step's HTML server-side**, then a vanilla TypeScript `<script>` flips `data-active="true"/false"` on `<section data-step="N">`. No framework runtime; Astro hoists the script into one ~15kB chunk. Sprint 4 should follow the same pattern — adding `<section data-step="5">` etc. — rather than reaching for React/Solid. The state machine in `initIntakeForm()` already namespaces `step1/step2/step3/step4` slices in the JSON; just add `step5..step10` collectors.
2. **The website URL is captured at the bottom of Step 1**, not in the original spec wireframe. Step 2's auto-prefill needs *some* URL to look up, and asking on Step 1 means it's "the URL the client just confirmed" by the time Step 2 paints. `maybeAutoPrefill()` runs both at initial paint AND after the Step 1 → 2 transition.
3. **Per-field provenance is a `<span class="field__provenance" data-source="...">` next to the label**, not a tooltip. The CSS pill colors come from the `data-source` attribute; the human-readable text from `provenanceLabel()`. When the user types into a prefilled field, `markProvenance(key, 'client')` flips the label to "Edited" — keep that contract intact in Sprint 4 if any later steps borrow this pattern.
4. **R2 uploads write through `POST /api/intake/[token]/upload`** which inserts into `intake_files` and returns metadata (`{ id, filename, size_bytes, mime_type, category }`). The form stores only that metadata in `data.step3.logos.color` etc.; the bytes never round-trip the JSON column. Sprint 5's R2 → Drive sync reads `intake_files` directly. Allowed categories live in `lib/files.ts:ALLOWED_CATEGORIES` — add to that set in Sprint 4 (e.g. project photos under `project_photo`) rather than overloading existing names.
5. **`tests/helpers/fake-d1.ts` only handles `intake_records` SQL.** Sprint 3 added `tests/helpers/fake-d1-extended.ts` to also support `intake_files` INSERTs for the upload tests; Sprint 4 extended it again with `intake_credentials` (INSERT/UPDATE/SELECT-first/SELECT-all). All three tables now live in one fake.
6. **Astro's `<script type="application/json">` needs `is:inline`** when it has any other attribute (like `set:html`); without it Astro warns and tries to process the JSON as a JS module. The state-hydration script is `<script is:inline type="application/json" data-intake-state>...</script>` — do not remove `is:inline`.
7. **The `:has()` CSS selector widens `Page.astro`'s 36rem main-column to 50rem** via a `<style>` block in `[token].astro` (`.page__main:has(.intake-shell)`). All evergreen Cloudflare-Workers-hostable browsers support `:has()` as of 2024+. If a layout regression appears in older Safari, fall back to a `Page.astro` `wide` prop instead of stripping the `:has()`.

## Lessons from Sprint 2 (read before Sprint 3+)

1. **The prefill cache reuses the `INTAKE_TOKENS` KV namespace** (with a `prefill:` key prefix) rather than adding a second binding. If you ever need to invalidate prefill caches without dropping live magic-link tokens, scan KV with the `prefix: 'prefill:'` option — don't `wrangler kv key list` and delete blindly.
2. **Astro happily allows both `[token].ts` (file) and `[token]/prefill.ts` (folder) in the same directory.** The router distinguishes them by URL pattern. `astro build` emits them side-by-side under `dist/_worker.js/pages/api/intake/`. If you ever rename `[token].ts`, do not also delete the folder — they are independent routes.
3. **`fetch` inside Cloudflare Workers respects `AbortController` but ignores `timeout`.** Our `fetchWithTimeout()` always sets up a controller; do the same in any new external lookup. Workers also have a 30s wall-clock budget, so per-request timeouts must stay well under that — we use 8s.
4. **AZ ROC + BBB scrapes are best-effort and fail open.** The Salesforce-rendered ROC page in particular returns mostly empty HTML to a server-side fetch; expect `miss` for live sites until proper API access lands (spec §14 still open). The form must always allow manual entry — never gate Step 2 on a successful ROC hit.
5. **`astro check` regenerates `src/env.d.ts`** by inserting a `<reference path="../.astro/types.d.ts" />` line. Don't commit that diff — it's a build artifact; revert with `git checkout src/env.d.ts` before committing.

## Lessons from Sprint 1 (read before Sprint 2+)

1. **Use `ulidx`, not `ulid`.** The original `ulid` package falls back to `require("crypto")` when `window` is undefined, which throws under Cloudflare Workers and 500s every route that imports the module. `ulidx` is the maintained fork that goes through `globalThis.crypto.getRandomValues`. Don't reintroduce `ulid`.
2. **Astro's `platformProxy` needs an explicit `configPath`.** Without `configPath: './wrangler.jsonc'` (post-migration; was `./wrangler.toml` pre-#13) in `astro.config.mjs`, the dev server walks up the directory tree, finds the marketing site's wrangler config (or none), and silently misses our D1/KV/R2 bindings — `/intake/api/health` reports `db: false` etc. with no obvious error.
3. **`wrangler` CLI also needs `--config ./wrangler.jsonc` from this subdir** for the same reason. The `db:migrate:*` and `db:query:*` scripts in `package.json` already include it; new wrangler invocations should follow suit.
4. **`wrangler pages secret put` needs `User → User Details:Read` on the API token** because it preflights `/memberships`. The deploy workflow [bypasses this](../.github/workflows/intake-deploy.yml) by PATCHing `/accounts/{id}/pages/projects/{name}` directly via curl, keeping the token's scope account-only per spec §13.
5. **The CF account ID is hardcoded in the deploy workflow** with `vars.CLOUDFLARE_ACCOUNT_ID` as an override. It's not actually a secret (it's in spec §13 + most CF URLs) and being hardcoded prevents silent degradation if the GitHub Actions variable is missing or misplaced under Secrets.
6. **The remote D1 migration runs on every push**, not just main. `wrangler d1 migrations apply --remote` is idempotent; running it on previews ensures schema-changing PRs don't ship without a corresponding migration.
7. **`/api/health` returning HTTP 503 is normal** until Sprint 5 lands. The endpoint reports `degraded` whenever any binding/secret check is false, including the Sprint-5 secrets that don't exist yet. The deploy workflow's smoke test only requires `db / kv / r2 / hmac_key_present` — see the `Smoke-test` step.

## Future-Claude: starting prompts per sprint

### Sprint 7 — QA, polish, prefill edge cases, mobile responsive

```
Read intake/README.md (all six "Lessons from Sprint N" sections
1–6 — they encode the full design history) and walk the production
URL https://aeolistings.ai/intake/c/<a-fresh-token> end-to-end on
a real phone (or DevTools mobile emulator) before touching any code.

Sprint 7 is the v1.0 finishing pass. Four buckets, scoped:

1. MAGIC-LINK AUTO-RECOVER (P1 — confirmed gap during Sprint 6 QA)
   The "This link is no longer valid" page at /intake/c/<consumed-token>
   currently tells the user to email intake@aeolistings.ai for a fresh
   link. That's a manual ops touchpoint. Real-world user behavior: they
   go back to the receipt email, click the same link, hit the 401 page.
   Auto-recover removes the human from the loop.

   Build:
   - POST /intake/api/intake/resend-link with body { email }
     · Look up most-recently-updated intake_records WHERE client_email = ?
     · If found: createToken(intake_id, env) + sendEmail with the magic link
     · Return 200 on hit AND miss (don't leak intake existence)
     · Rate-limit 1 req per email per 5 min via INTAKE_TOKENS KV with
       'resend:' prefix (same pattern Sprint 2 used for prefill cache)
   - Update the 401 page in src/pages/c/[token].astro:
     · Inline form: email input + "Email me a fresh link" button
     · On POST → swap form for "Check your inbox — if we have your intake
       on file, a new link is on its way."
     · Keep mailto:intake@aeolistings.ai as a fallback link below
   - Email template: reuse the Sprint-5 email.ts helpers; new function
     sendMagicLinkRecovery(env, { to, magic_link }). Subject: "Your
     Aeolistings intake — fresh magic link inside". 7-day expiry note.

   Security note: the recovery factor is the email address already on
   the intake row. If an attacker has email access they have everything
   else anyway. Rate limit + don't-leak-existence are sufficient.

   Tests: tests/resend-link.test.ts with stubbed fetch (same pattern as
   submit.test.ts):
   · 200 + email sent when intake exists
   · 200 + no email sent when intake doesn't exist (no enumeration)
   · 429 when rate-limited (or just 200 with the same generic message —
     decide based on whether ops needs the signal)
   · Token returned by createToken verifies via verifyToken (sanity)

2. PREFILL EDGE CASES (lib/prefill.ts + tests/prefill.test.ts)
   - JSON-LD parsing: handle @graph arrays, multiple Organization
     nodes, schema:ProfessionalService variants. Currently picks
     the first match; some real sites have noise (Person /
     WebSite) before the Organization.
   - AZ ROC: the Salesforce-rendered page returns near-empty HTML
     to server-side fetch. If proper API access lands (spec §14)
     before Sprint 7 starts, swap the scrape for the API; if not,
     document the "miss" rate per real client and decide whether
     to drop the scrape (since manual entry already works).
   - BBB: same — accreditation date parsing has only been tested
     against one HTML shape. Add fixtures from 3+ real BBB pages.

3. MOBILE RESPONSIVE (src/styles/form.css + Page.astro)
   - Repeat-item cards (testimonials, projects, custom cities,
     named experts, blackout ranges) stack awkwardly on <420px.
     Cards should single-column with full-width inputs.
   - File-upload slots: the dual color-logo + white-logo + favicon
     row breaks on phones. Consider a vertical stack with full-
     width drop targets.
   - The status banner from Sprint 6 is full-width good — verify
     it doesn't push the progress bar off-screen on iPhone SE.
   - Touch targets: every checkbox / radio in Steps 1 + 5 + 6
     needs to be ≥44px. Tailwind utilities should cover this; the
     few hand-styled spots in form.css may not.

4. POLISH + TESTING
   - Auto-save heartbeat: currently saves only on Continue. Sprint
     7 could add a 10-second debounced save on input — but only if
     the token-rotation cost is acceptable. Decide based on
     real-client failure modes (mainly: did anyone lose work?).
   - Empty-state UX: a fresh intake has nothing in many sections.
     The render functions (renderTestimonials etc.) should show
     "Add your first <thing>" not a blank list.
   - Brother-QA pattern from Sprint 4: fresh-eyes pass on every
     step. Track what trips up a non-engineer. Fix anything that
     does, log the rest as v1.1.

Tests: extend the existing suites (prefill.test.ts gets fixtures;
no new test file needed unless adding the auto-save heartbeat).
Run npm test + astro check + the production smoke (mint a token
via quote-events accept → complete intake → verify Notion + Slack
+ 1Password + emails) before the PR.

Out of scope for Sprint 7:
- Multi-client agency splitter (per spec §11 — v1.1+)
- Internal admin UI for ops (per spec §11)
- Bulk export (spec §11)
- Multilingual (spec §11)
- The intake.aeolistings.ai subdomain (pending CF support per spec §13)
```

