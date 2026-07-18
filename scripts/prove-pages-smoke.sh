#!/usr/bin/env bash
# Prove Holowan Pages SPA shell is live (HTTP + optional agent-browser).
# Usage: ./scripts/prove-pages-smoke.sh
set -eu

BASE="${PAZAAK_PAGES_URL:-https://oldrepublicwizard.github.io/pazaak-world}"
BASE="${BASE%/}"

echo "== HTTP shell =="
code=$(curl -sS --max-time 30 -o /tmp/pazaak-pages-index.html -w '%{http_code}' "$BASE/")
test "$code" = "200"
js=$(grep -oE '/pazaak-world/assets/[^"]+\.js' /tmp/pazaak-pages-index.html | head -1)
css=$(grep -oE '/pazaak-world/assets/[^"]+\.css' /tmp/pazaak-pages-index.html | head -1)
test -n "$js" && test -n "$css"
js_code=$(curl -sS --max-time 30 -o /dev/null -w '%{http_code}' "https://oldrepublicwizard.github.io${js}")
css_code=$(curl -sS --max-time 30 -o /dev/null -w '%{http_code}' "https://oldrepublicwizard.github.io${css}")
test "$js_code" = "200"
test "$css_code" = "200"
echo "HTTP OK ($BASE) js=$js_code css=$css_code"

if ! command -v agent-browser >/dev/null 2>&1; then
  echo "agent-browser not installed — HTTP-only smoke passed"
  exit 0
fi

echo "== Browser mount =="
SESSION="pazaak-pages-prove-$$"
agent-browser --session "$SESSION" open "$BASE/" >/dev/null
# First paint can take several seconds on cold CDN; poll for React mount.
mounted=0
for _ in $(seq 1 12); do
  agent-browser --session "$SESSION" wait 1000 >/dev/null
  root_raw=$(agent-browser --session "$SESSION" eval "String(document.getElementById('root')?.childElementCount ?? -1)" || true)
  root=${root_raw//\"/}
  if [ -n "$root" ] && [ "$root" != "0" ] && [ "$root" != "-1" ]; then
    mounted=1
    break
  fi
done
title=$(agent-browser --session "$SESSION" get title)
agent-browser --session "$SESSION" close >/dev/null || true

echo "title=$title rootChildren=$root"
echo "$title" | grep -qi 'pazaak'
test "$mounted" = "1"
echo "Browser mount OK"
