# aeolistings-quote-events

Cloudflare Worker that receives view + accept events from quote pages on
aeolistings.ai, persists them to a KV namespace, and emails the agency
through Resend (with a separate receipt email to the client on accept).

Bound to: `https://aeolistings.ai/api/quote-event`
Sends from: `AEO Listings <hello@aeolistings.ai>` (same Resend setup as the contact Worker)
Storage:    Cloudflare KV namespace `QUOTE_EVENTS`

## Auto-mint intake on accept

When a client accepts a quote, the Worker now POSTs to
`https://aeolistings.ai/intake/api/intake/create` with the client's
data + scope flags derived from the selected line items. The intake
endpoint mints a record + magic-link token, which the Worker then drops
into the client receipt email as a "Next: tell us about your business"
section so the intake form is reachable as soon as they accept — Jake no
longer mints the link by hand.

The scope-flag mapping (quote line-item `id` → intake `scope_flags` key):

| Quote line-item id | Intake `scope_flags` key |
|---|---|
| `website`           | `website`            |
| `gbp`               | `gbp`                |
| `social-setup`      | `social_foundation`  |
| `social-management` | `social_management`  |
| `aeo-retainer`      | `retainer`           |

Unknown line-item ids are skipped (forward-compatible — adding a new
line item to a quote markdown file doesn't break this Worker; it just
won't pre-check a flag in the intake form until this table is updated).

If the intake create call fails (network blip, intake worker 5xx,
missing secret) the acceptance itself still succeeds. The agency email
gets a `⚠️ INTAKE CREATE FAILED — mint manually` line, the client
receipt is sent without a magic-link section, and the failure is logged
to `wrangler tail`.

## Event shapes

Quote pages POST one of two shapes to `/api/quote-event`:

```json
// On page load
{ "event": "view", "slug": "...", "quoteId": "...", "business": "...", "ts": 1714411111111, "referrer": "..." }

// On accept-form submit
{ "event": "accept", "slug": "...", "quoteId": "...", "business": "...",
  "name": "...", "email": "...", "includeOptional": false, "note": "...", "ts": 1714411111111 }
```

The Worker writes one KV record per event under keys:

- `view:{slug}:{id}` — every view, in full
- `accept:{slug}:{acceptanceId}` — every acceptance, in full
- `firstview:{slug}` — set the first time a quote is opened (no expiry)
- `recentview:{slug}` — 24h TTL key used to throttle view notification emails

Repeat views inside the 24h window are still recorded under `view:` — the
deduplication only suppresses the email so the inbox doesn't fill up if a
client refreshes the page or clicks the link three times.

## One-time setup

```bash
cd workers/quote-events
npm install

# 1. Create the KV namespace and copy the printed id.
npx wrangler kv namespace create QUOTE_EVENTS

# 2. Paste that id into wrangler.toml under [[kv_namespaces]] (id = "...").

# 3. Set the Resend API key (the same key the contact Worker uses is fine).
npx wrangler secret put RESEND_API_KEY

# 4. Set the intake HMAC signing key — same value as the intake worker's
#    HMAC_SIGNING_KEY secret (and the INTAKE_HMAC_SIGNING_KEY GitHub
#    Actions secret). Used to authenticate against /intake/api/intake/create.
npx wrangler secret put INTAKE_HMAC_SIGNING_KEY  # paste same value as intake/HMAC_SIGNING_KEY

# 5. Deploy. The [[services]] binding in wrangler.toml requires the `intake`
#    Worker to already exist on the same account — it does (deployed by
#    .github/workflows/intake-deploy.yml). If you deploy this Worker BEFORE
#    the intake Worker exists for the first time, wrangler will warn and the
#    binding will be undefined at runtime; the auto-mint flow then falls back
#    to global fetch (which fails on same-zone subrequests; see note below).
#    Re-deploy this Worker after the intake Worker is live to wire it up.
npx wrangler deploy
```

### Note on same-zone subrequests

The auto-mint-on-accept flow calls `POST /intake/api/intake/create` on the
intake Worker. Both Workers run on the `aeolistings.ai` zone. Cloudflare's
edge has a same-zone subrequest pathology where global `fetch()` from one
Worker to another Worker's public URL **bypasses Worker Routes** and returns
404 from the static-asset origin instead of routing to the intended Worker.

We work around this with a **Service Binding** (`[[services]]` in
wrangler.toml, exposed as `env.INTAKE_SERVICE` at runtime). Service Bindings
route Worker-to-Worker subrequests directly, regardless of zone routing.
The code falls back to global `fetch()` if the binding is missing so local
tests and old deploys still work in degraded mode.

After deploy, the Worker is live at `https://aeolistings.ai/api/quote-event`
and quote pages will start recording views + accepts.

## Deploying changes

```bash
cd workers/quote-events
npx wrangler deploy
```

## Watching logs

```bash
cd workers/quote-events
npx wrangler tail
```

Streams every Worker invocation in real time — useful for confirming a
view event landed when you ask a client "did you have a chance to look?"

## Reading the event log

```bash
# List all events for a quote
npx wrangler kv key list --binding=QUOTE_EVENTS --prefix=view:stag-electric-arizona-q1m7k:
npx wrangler kv key list --binding=QUOTE_EVENTS --prefix=accept:stag-electric-arizona-q1m7k:

# Read one record
npx wrangler kv key get --binding=QUOTE_EVENTS "view:stag-electric-arizona-q1m7k:abc123-xyz"
```

## Local development

```bash
cd workers/quote-events
echo 'RESEND_API_KEY="re_your_dev_key"' > .dev.vars   # never commit this
npx wrangler dev
```

The Worker runs at `http://localhost:8787`. Wrangler will use a local KV
emulation by default. Test with curl:

```bash
curl -X POST http://localhost:8787 \
  -H "content-type: application/json" \
  -d '{"event":"view","slug":"stag-electric-arizona-q1m7k","quoteId":"AEO-2026-001","business":"Stag Electric Arizona","ts":1714411111111}'
```

## Adding or editing a quote

1. Create or edit a markdown file in `src/content/quotes/`.
2. Push. Cloudflare Pages redeploys; the URL `aeolistings.ai/quote/<slug>`
   is live immediately.
3. The Worker doesn't need to redeploy — it accepts whatever slug the
   page sends.

To make a quote URL hard to guess, append a random suffix to the
filename, e.g. `acme-plumbing-x7k2m.md` → `aeolistings.ai/quote/acme-plumbing-x7k2m`.

## Files

| File                    | Purpose                                                          |
|-------------------------|------------------------------------------------------------------|
| `src/index.ts`          | Worker handler — view/accept routing, KV writes, Resend send     |
| `wrangler.toml`         | Cloudflare deploy config + route + KV binding                    |
| `package.json`          | Wrangler + types as devDependencies                              |
| `tsconfig.json`         | TypeScript config (Workers runtime types)                        |
| `.gitignore`            | Excludes `.dev.vars` and `.wrangler/`                            |
