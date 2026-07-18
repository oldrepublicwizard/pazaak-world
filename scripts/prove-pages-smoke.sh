#!/usr/bin/env bash
# Prove Holowan Pages SPA shell is live (HTTP + optional agent-browser).
# Usage: ./scripts/prove-pages-smoke.sh
set -euo pipefail

BASE="${PAZAAK_PAGES_URL:-https://oldrepublicwizard.github.io/pazaak-world}"
BASE="${BASE%/}"

echo "== HTTP shell =="
code=$(curl -sS -o /tmp/pazaak-pages-index.html -w '%{http_code}' "$BASE/")
test "$code" = "200"
js=$(grep -oE '/pazaak-world/assets/[^"]+\.js' /tmp/pazaak-pages-index.html | head -1)
css=$(grep -oE '/pazaak-world/assets/[^"]+\.css' /tmp/pazaak-pages-index.html | head -1)
test -n "$js" && test -n "$css"
curl -sS -o /dev/null -w "js:%{http_code}\n" "https://oldrepublicwizard.github.io${js}" | grep -q 'js:200'
curl -sS -o /dev/null -w "css:%{http_code}\n" "https://oldrepublicwizard.github.io${css}" | grep -q 'css:200'
echo "HTTP OK ($BASE)"

if ! command -v agent-browser >/dev/null 2>&1; then
  echo "agent-browser not installed — HTTP-only smoke passed"
  exit 0
fi

echo "== Browser mount =="
SESSION="pazaak-pages-prove-$$"
agent-browser --session "$SESSION" open "$BASE/" >/dev/null
agent-browser --session "$SESSION" wait 5000 >/dev/null
title=$(agent-browser --session "$SESSION" get title)
root=$(agent-browser --session "$SESSION" eval "String(document.getElementById('root')?.childElementCount ?? -1)")
agent-browser --session "$SESSION" close >/dev/null || true

echo "title=$title rootChildren=$root"
# Title may be "Pazaak" briefly then "PazaakWorld — …"
echo "$title" | grep -qi 'pazaak'
test "$root" != "0" && test "$root" != "-1"
echo "Browser mount OK"
