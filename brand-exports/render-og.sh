#!/bin/bash
# Render the 1200x630 Open Graph card for aeolistings.ai.
# Same Chrome-headless + base64 @font-face technique as render.sh.
#
# Composition (brutalist-editorial, paper #FAF8F1):
#   - 80px padding
#   - Top-left:    "AEO LISTINGS" mono label in oxblood
#   - Body:        the hero question in Instrument Serif, ~64px, italic "you"
#   - Bottom row:  wordmark (left) + url (right), separated by hairline
#
# Output: public/og/og-default.png
set -euo pipefail
cd "$(dirname "$0")"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FONT_REGULAR=$(cat .font-regular.b64)
FONT_ITALIC=$(cat .font-italic.b64)

W=1200
H=630
OUT="../public/og/og-default.png"
HTML_FILE="og-default.html"

cat > "$HTML_FILE" <<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: 'Instrument Serif';
    font-style: normal;
    font-weight: 400;
    src: url(data:font/woff2;base64,${FONT_REGULAR}) format('woff2');
  }
  @font-face {
    font-family: 'Instrument Serif';
    font-style: italic;
    font-weight: 400;
    src: url(data:font/woff2;base64,${FONT_ITALIC}) format('woff2');
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #FAF8F1;
    width: ${W}px;
    height: ${H}px;
    overflow: hidden;
    font-family: 'Instrument Serif', serif;
    color: #1A1A1A;
  }
  .frame {
    width: ${W}px;
    height: ${H}px;
    padding: 56px 80px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .frame .top    { flex: 0 0 auto; }
  .frame .body   { flex: 1 1 auto; display: flex; align-items: center; min-height: 0; }
  .frame .bottom { flex: 0 0 auto; }
  .frame .bottom .row {
    border-top: 1px solid rgba(26, 26, 26, 0.18);
    padding-top: 22px;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  /* Top eyebrow */
  .eyebrow {
    font-family: 'Instrument Serif', serif;
    font-style: italic;
    font-weight: 400;
    color: #8B2F2F;
    font-size: 22px;
    letter-spacing: 0.06em;
    text-transform: lowercase;
  }
  /* The question */
  .headline {
    font-size: 68px;
    line-height: 1.02;
    letter-spacing: -0.015em;
    color: #1A1A1A;
    align-self: center;
    max-width: 1040px;
  }
  .headline em {
    font-style: italic;
    color: #8B2F2F;
  }
  .wordmark {
    font-size: 36px;
    letter-spacing: -0.01em;
    color: #1A1A1A;
  }
  .wordmark .tld {
    font-style: italic;
    color: #8B2F2F;
  }
  .meta {
    font-size: 18px;
    color: #1A1A1A;
    opacity: 0.65;
    letter-spacing: 0.04em;
  }
</style>
</head>
<body>
  <div class="frame">
    <div class="top">
      <div class="eyebrow">answer engine optimization</div>
    </div>
    <div class="body">
      <div class="headline">
        When someone asks ChatGPT who to hire, is it recommending <em>you</em>?
      </div>
    </div>
    <div class="bottom">
      <div class="row">
        <div class="wordmark">aeolistings<span class="tld">.ai</span></div>
        <div class="meta">retainer · cancel by email</div>
      </div>
    </div>
  </div>
</body>
</html>
HTML

mkdir -p "$(dirname "$OUT")"

# Chrome --headless=new reserves ~87px of vertical space for window chrome,
# so --window-size=1200,630 actually yields a 1200×543 CSS viewport. Pad the
# requested window height by 87px so the inner viewport matches H, then crop
# the resulting screenshot back to ${W}×${H} with sharp.
WIN_PAD=87
WIN_H=$((H + WIN_PAD))
RAW_OUT="$OUT.raw.png"

"$CHROME" \
  --headless=new \
  --disable-gpu \
  --hide-scrollbars \
  --default-background-color=FAF8F1FF \
  --force-device-scale-factor=1 \
  --virtual-time-budget=3000 \
  --screenshot="$RAW_OUT" \
  --window-size=${W},${WIN_H} \
  "file://$(pwd)/${HTML_FILE}" 2>/dev/null

rm -f "$HTML_FILE"

# Crop top-left ${W}×${H} from the ${W}×${WIN_H} raw capture
node -e "
const sharp = require('../node_modules/sharp');
sharp('$RAW_OUT')
  .extract({ left: 0, top: 0, width: $W, height: $H })
  .toFile('$OUT')
  .then(() => console.log('cropped'))
  .catch((e) => { console.error(e); process.exit(1); });
"
rm -f "$RAW_OUT"

echo "✓ ${OUT}"
ls -lh "$OUT"
