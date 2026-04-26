#!/bin/bash
# Render aeolistings.ai wordmark to PNG at multiple treatments.
# Uses Chrome headless + embedded @font-face (Instrument Serif).
set -euo pipefail
cd "$(dirname "$0")"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FONT_REGULAR=$(cat .font-regular.b64)
FONT_ITALIC=$(cat .font-italic.b64)

# Tight viewBox around the text glyphs:
#   "aeolistings.ai" at 72pt Instrument Serif is ~340 units wide.
#   We pad ~12 units each side + ~8 top / ~12 bottom for descender + breathing room.
#   Inner viewBox: -12 -8  →  370 x 120  (~3.08:1 aspect)
#   Output raster : 5x scale  →  1850 x 600
W=1850
H=600

render_variant () {
  local name="$1"
  local ink="$2"
  local bg="$3"        # "transparent" or a hex color
  local bgcolor_flag="$4"  # "00000000" for transparent, or "<hex>FF" for opaque

  local html_file="wordmark-${name}.html"
  local png_file="aeolistings-wordmark-${name}.png"

  cat > "$html_file" <<HTML
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
  html, body {
    margin: 0;
    padding: 0;
    background: ${bg};
    width: ${W}px;
    height: ${H}px;
    overflow: hidden;
  }
  svg {
    display: block;
    width: ${W}px;
    height: ${H}px;
  }
  text {
    font-family: 'Instrument Serif', serif;
  }
</style>
</head>
<body>
  <svg viewBox="-12 -8 370 120" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="72" font-size="72" fill="${ink}">aeolistings<tspan fill="#8B2F2F" font-style="italic">.ai</tspan></text>
  </svg>
</body>
</html>
HTML

  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --default-background-color=${bgcolor_flag} \
    --force-device-scale-factor=1 \
    --virtual-time-budget=3000 \
    --screenshot="${png_file}" \
    --window-size=${W},${H} \
    "file://$(pwd)/${html_file}" 2>/dev/null

  echo "✓ ${png_file}"
}

# Variant 1: dark ink on transparent — primary, universal
render_variant "dark"  "#1A1A1A" "transparent"    "00000000"

# Variant 2: paper ink on paper background — site-matching opaque
render_variant "paper" "#1A1A1A" "#FAF8F1"        "FAF8F1FF"

# Variant 3: light on transparent — for dark email themes / dark decks
render_variant "light" "#FAF8F1" "transparent"    "00000000"

# Clean up the intermediate HTML files but keep the base64 stash
rm -f wordmark-*.html

echo ""
echo "PNG outputs written to: $(pwd)"
ls -lh aeolistings-wordmark-*.png
