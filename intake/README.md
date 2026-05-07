# Aeolistings Client Intake — Application

The intake form clients fill out after signing a sales contract. Built per [`docs/specs/client-intake-v1.0.md`](../docs/specs/client-intake-v1.0.md).

**Status:** Scaffolded · Sprint 1 (auth + tokens) not yet implemented · Production deploy: `intake.aeolistings.ai`

## Quick reference

| Item | Value |
|---|---|
| Production URL | `https://intake.aeolistings.ai/c/<token>` |
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

Deploys are driven by [`.github/workflows/intake-deploy.yml`](../.github/workflows/intake-deploy.yml). Any push that touches `intake/**` triggers it: tests run, the app builds, the HMAC secret is pushed to Pages, pending D1 migrations apply against the remote DB, and `wrangler pages deploy` publishes. Push to `main` → production at `intake.aeolistings.ai`. Push to any other branch → preview at `<branch-slug>.aeolistings-intake.pages.dev`. The workflow ends with a curl probe of `/api/health` so a deploy that fails to bind D1/KV/R2 fails the run instead of silently shipping.

### One-time setup

Configure these in `Settings → Secrets and variables → Actions` for the repo:

| Kind | Name | Value |
|---|---|---|
| Variable | `CLOUDFLARE_ACCOUNT_ID` | `f700964246b5d61966399989f1910a56` (per spec §13) |
| Secret | `CLOUDFLARE_API_TOKEN` | Created in Cloudflare → My Profile → API Tokens. Scope per spec §13: Account-level Pages:Edit + Workers:Edit + D1:Edit + KV:Edit + R2:Edit; Zone-level `aeolistings.ai` only |
| Secret | `INTAKE_HMAC_SIGNING_KEY` | `openssl rand -hex 32`. **Different value from local `.dev.vars`** — store this one in 1Password Business → *Aeolistings Client Credentials* vault as "Intake System HMAC Signing Key — Prod" |

The first run also calls `wrangler pages project create`, so the Pages project doesn't have to pre-exist.

### Ad-hoc local deploy (rare)

```bash
npm run build
CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… \
  npx wrangler pages deploy dist --project-name=aeolistings-intake
```

## Project structure

```
intake/
├── README.md                       ← you are here
├── package.json                    ← deps + scripts
├── astro.config.mjs                ← Astro + Cloudflare adapter
├── wrangler.toml                   ← Cloudflare bindings
├── .dev.vars.example               ← secret template (real values in .dev.vars, gitignored)
├── .gitignore                      ← ignore .dev.vars, node_modules, dist, .wrangler
├── tsconfig.json                   ← TypeScript config
├── src/
│   ├── env.d.ts                    ← TypeScript types for Cloudflare bindings
│   ├── layouts/
│   │   └── Page.astro              ← shared chrome (head, main, footer) + brand tokens
│   ├── pages/
│   │   ├── index.astro             ← bare-domain landing
│   │   ├── 404.astro               ← branded fallback
│   │   ├── c/[token].astro         ← magic-link landing (Sprint 1 placeholder; Sprint 3 swaps in the form)
│   │   └── api/
│   │       ├── health.ts           ← health check endpoint
│   │       └── intake/
│   │           ├── create.ts       ← POST: admin-keyed; mints intake + magic link
│   │           ├── [token].ts      ← GET resume / POST save (rotates token)
│   │           └── [token]/
│   │               └── prefill.ts  ← POST: Step 2 auto-prefill (Sprint 2) ✅
│   ├── lib/
│   │   ├── tokens.ts               ← HMAC magic-link helpers (Sprint 1) ✅
│   │   ├── intake.ts               ← D1 create / get / patch helpers (Sprint 1) ✅
│   │   ├── prefill.ts              ← Step 2 prefill: crawl + AZ ROC + BBB + KV cache (Sprint 2) ✅
│   │   ├── notion.ts               ← Notion API client wrapper (Sprint 5)
│   │   ├── slack.ts                ← Slack webhook poster (Sprint 5)
│   │   └── 1password.ts            ← 1Password Connect client (Sprint 5)
│   └── styles/
│       └── global.css              ← brand tokens mirroring aeolistings.ai
├── tests/
│   ├── tokens.test.ts              ← 20 unit tests for the four token primitives
│   ├── intake-flow.test.ts         ← 11 route-handler integration tests
│   ├── prefill.test.ts             ← 19 tests covering JSON-LD / scrape / ROC / BBB / cache
│   └── helpers/                    ← in-memory KV + D1 fakes
└── migrations/
    └── 0001_initial.sql            ← D1 schema from spec section 7
```

## Sprint plan

Per spec section 10:

- ✅ **Sprint 1** — Magic-link auth + token system + KV setup (delivered: 31/31 tests, GitHub Actions deploy workflow, branded landing/404/`/c/<token>` placeholder)
- ✅ **Sprint 2** — Step 2 prefill: website crawl (JSON-LD + scrape fallback), AZ ROC + BBB lookups, 24h KV cache, `POST /api/intake/[token]/prefill` (50/50 tests)
- **Sprint 3** — Steps 0–4 UI (welcome through trust signals) (5–6 days)
- **Sprint 4** — Steps 5–10 UI (digital access through review) (5–6 days)
- **Sprint 5** — Submit handler + Notion / Slack / R2 / 1Password integrations (4–5 days)
- **Sprint 6** — Post-submit edit flow + notification logic (2–3 days)
- **Sprint 7** — QA, polish, prefill edge cases, mobile responsive (3–4 days)

For Claude-in-Code dev sessions, each sprint is roughly **one focused session**.

## Lessons from Sprint 2 (read before Sprint 3+)

1. **The prefill cache reuses the `INTAKE_TOKENS` KV namespace** (with a `prefill:` key prefix) rather than adding a second binding. If you ever need to invalidate prefill caches without dropping live magic-link tokens, scan KV with the `prefix: 'prefill:'` option — don't `wrangler kv key list` and delete blindly.
2. **Astro happily allows both `[token].ts` (file) and `[token]/prefill.ts` (folder) in the same directory.** The router distinguishes them by URL pattern. `astro build` emits them side-by-side under `dist/_worker.js/pages/api/intake/`. If you ever rename `[token].ts`, do not also delete the folder — they are independent routes.
3. **`fetch` inside Cloudflare Workers respects `AbortController` but ignores `timeout`.** Our `fetchWithTimeout()` always sets up a controller; do the same in any new external lookup. Workers also have a 30s wall-clock budget, so per-request timeouts must stay well under that — we use 8s.
4. **AZ ROC + BBB scrapes are best-effort and fail open.** The Salesforce-rendered ROC page in particular returns mostly empty HTML to a server-side fetch; expect `miss` for live sites until proper API access lands (spec §14 still open). The form must always allow manual entry — never gate Step 2 on a successful ROC hit.
5. **`astro check` regenerates `src/env.d.ts`** by inserting a `<reference path="../.astro/types.d.ts" />` line. Don't commit that diff — it's a build artifact; revert with `git checkout src/env.d.ts` before committing.

## Lessons from Sprint 1 (read before Sprint 2+)

1. **Use `ulidx`, not `ulid`.** The original `ulid` package falls back to `require("crypto")` when `window` is undefined, which throws under Cloudflare Workers and 500s every route that imports the module. `ulidx` is the maintained fork that goes through `globalThis.crypto.getRandomValues`. Don't reintroduce `ulid`.
2. **Astro's `platformProxy` needs an explicit `configPath`.** Without `configPath: './wrangler.toml'` in `astro.config.mjs`, the dev server walks up the directory tree, finds the marketing site's wrangler config (or none), and silently misses our D1/KV/R2 bindings — `/api/health` reports `db: false` etc. with no obvious error.
3. **`wrangler` CLI also needs `--config ./wrangler.toml` from this subdir** for the same reason. The `db:migrate:*` and `db:query:*` scripts in `package.json` already include it; new wrangler invocations should follow suit.
4. **`wrangler pages secret put` needs `User → User Details:Read` on the API token** because it preflights `/memberships`. The deploy workflow [bypasses this](../.github/workflows/intake-deploy.yml) by PATCHing `/accounts/{id}/pages/projects/{name}` directly via curl, keeping the token's scope account-only per spec §13.
5. **The CF account ID is hardcoded in the deploy workflow** with `vars.CLOUDFLARE_ACCOUNT_ID` as an override. It's not actually a secret (it's in spec §13 + most CF URLs) and being hardcoded prevents silent degradation if the GitHub Actions variable is missing or misplaced under Secrets.
6. **The remote D1 migration runs on every push**, not just main. `wrangler d1 migrations apply --remote` is idempotent; running it on previews ensures schema-changing PRs don't ship without a corresponding migration.
7. **`/api/health` returning HTTP 503 is normal** until Sprint 5 lands. The endpoint reports `degraded` whenever any binding/secret check is false, including the Sprint-5 secrets that don't exist yet. The deploy workflow's smoke test only requires `db / kv / r2 / hmac_key_present` — see the `Smoke-test` step.

## Future-Claude: starting prompts per sprint

### Sprint 3 — Steps 0–4 UI

```
Read intake/README.md, docs/specs/client-intake-v1.0.md (especially
section 4 wireframes for steps 0–4), intake/src/pages/c/[token].astro
(the placeholder), and intake/src/lib/prefill.ts (Sprint 2 — already
shipped). Replace the placeholder body with the ten-step form
skeleton (this sprint ships steps 0–4: welcome, confirm scope,
business identity, brand assets, trust signals).

Form state lives in the `data` JSON column of intake_records; each
step PATCHes /api/intake/[token] on advance, which rotates the token.
Save & exit at any step. Use Page.astro for chrome.

Step 2 should call POST /api/intake/[token]/prefill on first arrival
to autofill from the website URL the client just confirmed; render a
clear "Source: website / AZ ROC / BBB" provenance label per field so
the client knows what's been guessed.

Tests: each step renders for a valid token, save patches the right
JSON path, the rotated token survives a refresh, the prefill button
populates Step 2 fields. Local + preview deploy + UX walkthrough on
the live URL before PR.
```
