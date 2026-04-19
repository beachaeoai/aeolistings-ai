#!/usr/bin/env bash
# Wrapper to run `npm run dev` with nvm's Node on PATH.
# preview_start spawns with an empty PATH, so we reconstruct it here.
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd "$(dirname "$0")/.." || exit 1
exec npm run dev -- --host 127.0.0.1 --port 4321
