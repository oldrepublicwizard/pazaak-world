---
module: apps/pazaak-world
date: 2026-07-18
problem_type: runtime_error
component: browser-api-bases
severity: high
tags:
  - github-pages
  - vite
  - api-bases
  - static-hosting
  - holowan
---

# GitHub Pages must not use same-origin `/api` without `VITE_API_BASES`

## Problem

Live SPA at `https://oldrepublicwizard.github.io/pazaak-world/` mounted successfully (onboarding → Match Hub → Blackjack), but the browser issued fetches to:

- `https://oldrepublicwizard.github.io/api/me`
- `https://oldrepublicwizard.github.io/api/cardworld/config`

Those hit the **org Pages root**, not a bot/Worker API (GitHub returns 404 HTML ~5KB). Cause: when `vars.PAZAAK_API_BASES` is unset at build time, `resolveBrowserApiBases` fell back to `[""]` (same-origin relative paths).

## Fix

1. `resolveBrowserApiBases`: if hostname ends with `.github.io` and no configured bases → return `[]`.
2. `fetchWithFailover`: empty `apiBases` → synthetic `503` JSON (no network call).
3. `shouldUseRealtimeWebSocket`: require at least one non-empty API base; treat empty+github.io as static.

## Verification

```bash
# Unit
pnpm --filter @pazaak/platform build
node --test packages/platform/dist/utils.test.js

# Live shell (agent-browser / curl)
curl -sI https://oldrepublicwizard.github.io/pazaak-world/   # 200
# After redeploy: Network tab must NOT show github.io/api/*
```

## Related product truth (smoke)

Without `chitin.key`, full local Pazaak AI is gated; **Blackjack Practice** remains the always-on playable slice on static Pages. Online Match / Lobby stay disabled until a real API base + unlock path exist.

## Prevention

- Pages workflow already wires `VITE_API_BASES: ${{ vars.PAZAAK_API_BASES }}` — set the repo variable when a bot/Worker URL is live.
- Do not treat empty-string API base as “online” on static hosts.
