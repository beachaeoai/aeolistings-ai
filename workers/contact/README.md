# aeolistings-contact

Cloudflare Worker that receives POST requests from the `/contact` form on
aeolistings.ai, validates them, runs anti-spam checks, and sends the email
through Resend.

Bound to: `https://aeolistings.ai/api/contact`
Sends from: `hello@aeolistings.ai` (DKIM-signed via `send.aeolistings.ai`)
Sends to: `hello@aeolistings.ai` (Google Workspace alias → jake@'s inbox)
Reply-To: the form submitter's email

## One-time setup

You need this once, ever:

```bash
cd workers/contact
npm install
npx wrangler login                      # opens browser, log in to Cloudflare
npx wrangler secret put RESEND_API_KEY   # paste your Resend key when prompted
npx wrangler deploy                      # builds and deploys
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
npx wrangler secret put RESEND_API_KEY
# paste the new key — it overwrites the old one immediately
```

Revoke the old key in Resend after the new one is deployed.

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
- **Subdomain DKIM**: Resend signs outbound mail with DKIM on
  `send.aeolistings.ai`, but the visible "From" is `hello@aeolistings.ai`.
  DMARC passes via organizational-domain alignment. This is the standard
  pattern for transactional email from a domain that already has a primary
  mail provider on the root.
- **Coexistence with Google Workspace**: the root MX records still point to
  Google Workspace. This Worker only sends; it never touches the inbound
  mail flow. `hello@aeolistings.ai` is a Workspace alias of jake@'s mailbox,
  so all replies land in your normal Gmail inbox.

## Files

| File              | Purpose                                            |
|-------------------|----------------------------------------------------|
| `src/index.ts`    | Worker handler — validation, spam checks, send     |
| `wrangler.toml`   | Cloudflare deploy config + route binding           |
| `package.json`    | Wrangler + types as devDependencies                |
| `tsconfig.json`   | TypeScript config (Workers runtime types)          |
| `.gitignore`      | Excludes `.dev.vars` and `.wrangler/` from commits |
