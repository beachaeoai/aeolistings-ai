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
│   ├── pages/
│   │   ├── index.astro             ← placeholder home page
│   │   ├── c/[token]/              ← client intake form routes (one .astro per step) — TODO
│   │   └── api/
│   │       └── health.ts           ← health check endpoint
│   ├── lib/
│   │   ├── tokens.ts               ← HMAC magic-link helpers (Sprint 1)
│   │   ├── notion.ts               ← Notion API client wrapper (Sprint 5)
│   │   ├── slack.ts                ← Slack webhook poster (Sprint 5)
│   │   └── 1password.ts            ← 1Password Connect client (Sprint 5)
│   └── styles/
│       └── global.css              ← brand tokens mirroring aeolistings.ai
└── migrations/
    └── 0001_initial.sql            ← D1 schema from spec section 7
```

## Sprint plan

Per spec section 10:

- **Sprint 1** — Magic-link auth + token system + KV setup (3–4 days)
- **Sprint 2** — Step 2 prefill (website crawl + public records lookup) (4–5 days, derisks earliest)
- **Sprint 3** — Steps 0–4 UI (welcome through trust signals) (5–6 days)
- **Sprint 4** — Steps 5–10 UI (digital access through review) (5–6 days)
- **Sprint 5** — Submit handler + Notion / Slack / R2 / 1Password integrations (4–5 days)
- **Sprint 6** — Post-submit edit flow + notification logic (2–3 days)
- **Sprint 7** — QA, polish, prefill edge cases, mobile responsive (3–4 days)

For Claude-in-Code dev sessions, each sprint is roughly **one focused session**.

## Future-Claude: how to start a Sprint 1 session

```
"Read intake/README.md and docs/specs/client-intake-v1.0.md.
Implement Sprint 1 (magic-link auth + token system).
Cover the create / save / resume / verify / expire token flows
per spec section 5. Tests for each. Local Wrangler dev + remote
preview deploy when ready."
```
