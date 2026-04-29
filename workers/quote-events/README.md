# aeolistings-quote-events

Cloudflare Worker that receives view + accept events from quote pages on
aeolistings.ai, persists them to a KV namespace, and emails the agency
through Resend (with a separate receipt email to the client on accept).

Bound to: `https://aeolistings.ai/api/quote-event`
Sends from: `AEO Listings <hello@aeolistings.ai>` (same Resend setup as the contact Worker)
Storage:    Cloudflare KV namespace `QUOTE_EVENTS`

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

# 4. Deploy.
npx wrangler deploy
```

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
