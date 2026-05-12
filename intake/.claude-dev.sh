#!/usr/bin/env bash
# Launch helper for the intake Astro dev server.
# preview_start spawns with an empty PATH; reconstruct via nvm.
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd "$(dirname "$0")" || exit 1
exec npm run dev -- --host 127.0.0.1 --port 4322
