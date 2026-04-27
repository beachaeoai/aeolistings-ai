#!/usr/bin/env bash
#
# setup-key.sh — One-shot Resend key setup for the contact Worker.
#
# What this does, in order:
#   1. Prompts you to paste the Resend API key (input hidden, never logged)
#   2. Sanity-checks the key shape (prefix, length, no whitespace damage)
#   3. Validates the key against Resend's API by attempting a real send
#      from hello@send.aeolistings.ai → hello@aeolistings.ai
#   4. If valid, uploads it as the wrangler secret RESEND_API_KEY
#      (using stdin pipe to avoid the interactive-prompt paste corruption
#      that's bitten this setup before)
#   5. Tests the live /api/contact endpoint to confirm end-to-end works
#
# Run this any time you rotate the Resend API key. No redeploy needed —
# secret updates hot-swap on the next Worker invocation.
#
# Run from anywhere — the script cds to its own directory's parent (the
# workers/contact root) before invoking wrangler.

set -euo pipefail

# ── Locate the workers/contact root ──────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKER_DIR="$(dirname "$SCRIPT_DIR")"
cd "$WORKER_DIR"

# ── Pretty output helpers ────────────────────────────────────────────────
GREEN=$'\033[32m'; RED=$'\033[31m'; DIM=$'\033[2m'; BOLD=$'\033[1m'; RESET=$'\033[0m'
ok()    { echo "${GREEN}✓${RESET} $*"; }
fail()  { echo "${RED}✗${RESET} $*" >&2; }
step()  { echo; echo "${BOLD}▸ $*${RESET}"; }
note()  { echo "  ${DIM}$*${RESET}"; }

# ── Step 1: read the key without echoing or logging ──────────────────────
step "1/5  Paste your Resend API key"
note "Input is hidden. Right-click → paste, then press Enter."
note "If you don't have one, generate at https://resend.com/api-keys"
echo
printf "  Key: "
IFS= read -r -s RESEND_KEY
echo

if [[ -z "$RESEND_KEY" ]]; then
  fail "No key provided. Aborting."
  exit 1
fi

# ── Step 2: sanity-check the key shape ───────────────────────────────────
step "2/5  Sanity-checking key shape"
KEY_LEN=${#RESEND_KEY}
KEY_PREFIX="${RESEND_KEY:0:3}"

if [[ "$KEY_PREFIX" != "re_" ]]; then
  fail "Key doesn't start with 're_' (got '${KEY_PREFIX}')."
  fail "That's not a Resend API key — check what you copied."
  exit 1
fi

# Resend keys are typically 36 chars (re_ + 33-char body). Reject obviously
# wrong shapes — usually means a partial paste, accidental newline, or
# trailing whitespace.
if (( KEY_LEN < 30 || KEY_LEN > 80 )); then
  fail "Unexpected key length (${KEY_LEN} chars). Expected ~36."
  fail "Probable causes: partial paste, smart-quote injection, trailing newline."
  exit 1
fi

if [[ "$RESEND_KEY" =~ [[:space:]] ]]; then
  fail "Key contains whitespace. Re-copy from Resend without leading/trailing spaces."
  exit 1
fi

ok "Shape OK — ${KEY_LEN} chars, starts with re_"

# ── Step 3: validate against Resend's API ────────────────────────────────
step "3/5  Validating key against Resend API"
note "Sending a real test email from hello@aeolistings.ai → hello@aeolistings.ai"

VALIDATION_RESPONSE=$(curl -s -w "\n__HTTP__%{http_code}" -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "AEO Listings <hello@aeolistings.ai>",
    "to": ["hello@aeolistings.ai"],
    "subject": "[setup-key.sh] Resend key validation",
    "text": "If you see this in your inbox, the API key is valid and the bare-domain From address is working. Sent by workers/contact/scripts/setup-key.sh during key setup. Safe to delete."
  }')

VALIDATION_HTTP="${VALIDATION_RESPONSE##*__HTTP__}"
VALIDATION_BODY="${VALIDATION_RESPONSE%__HTTP__*}"

if [[ "$VALIDATION_HTTP" != "200" ]]; then
  fail "Resend rejected the test send (HTTP ${VALIDATION_HTTP})"
  echo "  Response body:"
  echo "  $VALIDATION_BODY" | sed 's/^/    /'
  echo
  case "$VALIDATION_HTTP" in
    401)
      fail "Diagnosis: API key is invalid. Check Resend dashboard — was it revoked?"
      fail "           Or generate a new key and re-run this script."
      ;;
    403)
      fail "Diagnosis: domain not verified, or key lacks send permission."
      ;;
    422)
      fail "Diagnosis: validation error. Likely the From address isn't on a verified domain."
      ;;
    *)
      fail "Unexpected status — paste the response body to your dev for help."
      ;;
  esac
  unset RESEND_KEY
  exit 1
fi

EMAIL_ID=$(echo "$VALIDATION_BODY" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
ok "Resend accepted the send (id: ${EMAIL_ID:-unknown})"
note "Check your inbox — the test email should arrive within a few seconds."

# ── Step 4: upload as wrangler secret via stdin (no paste corruption) ────
step "4/5  Uploading as Worker secret RESEND_API_KEY"
note "Using stdin pipe to avoid the interactive-prompt paste issues"

if ! printf '%s' "$RESEND_KEY" | npx --yes wrangler secret put RESEND_API_KEY 2>&1 | sed 's/^/  /'; then
  fail "wrangler secret upload failed."
  fail "Check that you're authenticated: 'npx wrangler whoami' should print your account."
  unset RESEND_KEY
  exit 1
fi

ok "Secret uploaded — Worker will use this on the next invocation (no redeploy needed)"

# Clear from this shell session
unset RESEND_KEY

# ── Step 5: live test of /api/contact ────────────────────────────────────
step "5/5  Live-testing https://aeolistings.ai/api/contact"
note "This sends a real form submission. Watch for the second test email."

# Brief pause — secret hot-swap is fast but not always instant
sleep 2

LIVE_RESPONSE=$(curl -s -w "\n__HTTP__%{http_code}" -X POST https://aeolistings.ai/api/contact \
  -H "content-type: application/json" \
  -d '{
    "name": "setup-key.sh deploy verification",
    "email": "jake@aeolistings.ai",
    "business": "AEO Listings",
    "city": "Mesa, AZ",
    "service": "Not sure yet",
    "message": "Automated post-deploy test sent by workers/contact/scripts/setup-key.sh. If this lands in your inbox, the contact form is fully working end-to-end. Safe to delete.",
    "_ts": 0
  }')

LIVE_HTTP="${LIVE_RESPONSE##*__HTTP__}"
LIVE_BODY="${LIVE_RESPONSE%__HTTP__*}"

if [[ "$LIVE_HTTP" == "200" ]] && [[ "$LIVE_BODY" == *'"ok":true'* ]]; then
  ok "Live endpoint responded 200 OK"
  echo
  echo "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo "${GREEN}${BOLD}  Contact form is live and working end-to-end.${RESET}"
  echo "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo
  echo "  You should see ${BOLD}two${RESET} test emails in your inbox:"
  echo "    1. Resend key validation (from step 3)"
  echo "    2. Live form submission (from this step)"
  echo
  echo "  Watch real-time form traffic any time with: ${DIM}npx wrangler tail${RESET}"
  exit 0
else
  fail "Live endpoint returned HTTP ${LIVE_HTTP}"
  echo "  Response: $LIVE_BODY"
  echo
  fail "Run 'npx wrangler tail' in another terminal and re-fire the test to see"
  fail "the exact Worker error. Most likely: secret hot-swap delay (wait 30s, retry)"
  fail "                       or: deployed Worker code is older than this script."
  exit 1
fi
