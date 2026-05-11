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
- **Sprint 5** — Submit handler + Notion / Slack / R2 / 1Password integrations (4–5 days)
- **Sprint 6** — Post-submit edit flow + notification logic (2–3 days)
- **Sprint 7** — QA, polish, prefill edge cases, mobile responsive (3–4 days)

For Claude-in-Code dev sessions, each sprint is roughly **one focused session**.

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

### Sprint 5 — Submit handler + integrations

```
Read intake/README.md (especially "Lessons from Sprint 4"),
docs/specs/client-intake-v1.0.md sections 8 (submit handler) and 9
(Notion template structure), and the Sprint-4 stub at the bottom of
the click handler in intake/src/pages/c/[token].astro (the 'submit'
case). Replace the Sprint-4 success-banner stub with a real submit
handler:

  POST /api/intake/[token]/submit
  1. Validate the intake (record exists, not already submitted)
  2. status='submitted', submitted_at=now
  3. Side effects (run as Worker subtasks; partial-failure tolerant):
     a. Slack webhook → #client-onboarding
     b. Notion API: duplicate the master template page, populate fields
     c. R2 → Drive sync of brand assets (read intake_files directly)
     d. 1Password notify: post credential-method summary to ops vault
        (read intake_credentials directly — not data.step5)
     e. Email confirmation (Resend) to client + ops

Wire the existing lib stubs (notion.ts, slack.ts, 1password.ts) to
real API calls. Keep secrets in env per the existing pattern.
The Step 10 client UI replaces its stub banner with the real
"Submitted ✓ — check your inbox" state on a 200.

Tests: stub each integration's fetch path (see prefill.test.ts for
the pattern) so the test suite remains hermetic. Confirm partial
failure (e.g. Slack down) doesn't 500 the submit endpoint.
Local + preview deploy + UX walkthrough on the live URL before PR.
```
