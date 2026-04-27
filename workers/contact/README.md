# aeolistings-contact

Cloudflare Worker that receives POST requests from the `/contact` form on
aeolistings.ai, validates them, runs anti-spam checks, and sends the email
through Resend.

Bound to: `https://aeolistings.ai/api/contact`
Sends from: `AEO Listings <hello@aeolistings.ai>` (bare domain, Resend-verified, DKIM-signed)
Sends to: `hello@aeolistings.ai` (Google Workspace alias → jake@'s inbox)
Reply-To: the form submitter's email

## One-time setup

You need this once, ever:

```bash
cd workers/contact
npm install

# Auth — pick one:
#   A) export CLOUDFLARE_API_TOKEN=... in your shell (recommended; survives reboots)
#   B) npx wrangler login (opens browser; OAuth flow can fail on some networks)

scripts/setup-key.sh                    # one-shot: validates Resend key, uploads, tests
npx wrangler deploy                      # ships the Worker code
```

After `wrangler deploy` completes, the Worker is live at
`https://aeolistings.ai/api/contact` and the contact form will work
end-to-end.

## Deploying changes

```bash
cd workers/contact
npx wrangler deploy
```

That's it. Cloudflare keeps prior versions; rollbacks are one click in the
dashboard if anything ever goes wrong.

## Watching logs

```bash
cd workers/contact
npx wrangler tail
```

Streams every Worker invocation to your terminal in real time. Useful for
debugging spam patterns or Resend errors. Ctrl-C to stop.

## Rotating the Resend API key

Generate a fresh key in the Resend dashboard, then:

```bash
cd workers/contact
scripts/setup-key.sh
# Validates the key against Resend, uploads it as the wrangler secret,
# and runs a live test of /api/contact. No redeploy needed.
```

Revoke the old key in Resend after the new one is confirmed working.

If you'd rather do it the manual way:

```bash
cd workers/contact
npx wrangler secret put RESEND_API_KEY
# paste the new key — it overwrites the old one immediately
```

## Local development

```bash
cd workers/contact
echo 'RESEND_API_KEY="re_your_dev_key"' > .dev.vars   # never commit this
npx wrangler dev
```

The Worker runs at `http://localhost:8787`. Test with curl:

```bash
curl -X POST http://localhost:8787 \
  -H "content-type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"hello","_ts":0}'
```

(`_ts: 0` bypasses the time-trap during testing — production requests must
use the real timestamp.)

## How the anti-spam works

Two layers, no CAPTCHA:

1. **Honeypot** — a hidden `_company` field bots will fill but humans never
   see. Filled = silent drop (we return `{ok: true}` so the bot doesn't
   know the trap exists and doesn't retry from another IP).
2. **Time-trap** — the form submits a `_ts` timestamp set when it was
   rendered. Submissions arriving sooner than 3 seconds after page load
   are dropped silently (humans never type that fast).

Together these kill ~95%+ of automated form spam without harming UX. If
volume ever materializes despite this, the next layer is Cloudflare Turnstile
(invisible CAPTCHA, free) — easy to add later.

## Architecture notes

- **Same-origin fetch**: the form posts to `/api/contact` (relative URL)
  rather than a `*.workers.dev` subdomain. The route binding in
  `wrangler.toml` makes `aeolistings.ai/api/contact` go to this Worker
  while every other path on aeolistings.ai still serves the static site.
  No CORS, no preflight, no cross-domain cookies.
- **Bare-domain From**: We verified `aeolistings.ai` directly in Resend
  (DKIM TXT at `resend._domainkey.aeolistings.ai`), so the From address
  is `hello@aeolistings.ai` — same address recipients reply to. Cleanest
  possible setup; no subdomain visible in headers.
- **Coexistence with Google Workspace**: the root MX records still point
  to Google Workspace (Workspace owns inbound). Resend owns outbound via
  DKIM. Root SPF lists Google only, but DMARC alignment is satisfied via
  DKIM signing alone, so deliverability is unaffected. The only
  optional improvement would be merging `include:amazonses.com` into the
  root SPF for belt-and-suspenders authentication — not required.
- **Reply flow**: Reply-To header is set to the form submitter's email,
  so hitting Reply in Gmail goes straight to the prospect rather than
  back to `hello@`. The friendly name "AEO Listings" is what recipients
  see in their inbox From column.

## Files

| File                     | Purpose                                            |
|--------------------------|----------------------------------------------------|
| `src/index.ts`           | Worker handler — validation, spam checks, send     |
| `wrangler.toml`          | Cloudflare deploy config + route binding           |
| `package.json`           | Wrangler + types as devDependencies                |
| `tsconfig.json`          | TypeScript config (Workers runtime types)          |
| `.gitignore`             | Excludes `.dev.vars` and `.wrangler/` from commits |
| `scripts/setup-key.sh`   | Validate Resend key + upload secret + live test    |
