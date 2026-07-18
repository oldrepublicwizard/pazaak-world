---
title: Guest ensure-guest and API-only local multiplayer
date: 2026-07-18
category: developer-experience
module: apps/pazaak-bot
problem_type: developer_experience
component: authentication
severity: high
applies_when:
  - "Browser guests need Match/Lobby against the Node bot (not only the Worker)"
  - "Local multiplayer must run without Discord application secrets"
  - "GitHub Pages builds have empty VITE_API_BASES"
tags:
  - ensure-guest
  - api-only
  - matchmaking
  - github-pages
  - holowan
  - pazaak-world
---

# Guest ensure-guest and API-only local multiplayer

## Context

Holowan Pages guests use a browser-only `local-guest-token:guest-*` until an API origin exists. The SPA then calls `POST /api/auth/ensure-guest` to mint a real app session before Match/Lobby. The Cloudflare Worker already implemented that route; the embedded `pazaak-bot` API did not, so guest Find Match failed after a silent upgrade miss (401s). Separately, `pnpm dev:pazaak` required Discord bot tokens even for API-only browser play, and Match buttons treated `navigator.onLine` as “API available,” which is false on static Pages without `PAZAAK_API_BASES`.

## Guidance

1. **Bot parity:** Implement `POST /api/auth/ensure-guest` on `pazaak-bot` via `JsonPazaakAccountRepository.ensureGuestAccount` (`accountId = guest:${guestId}`), returning `{ app_token, displayName, userId }` like the Worker.
2. **Local API without Discord:** Prefer `pnpm dev:pazaak-api` (`apps/pazaak-bot/src/api-only.ts`) or `PAZAAK_API_ONLY=1` so Discord gateway login and required Discord env vars are skipped; always enable `PAZAAK_ALLOW_DEV_AUTH` for `?devUser=` probes.
3. **Honest Pages UX:** Gate Match/Lobby on `Boolean(getPrimaryBrowserApiOrigin()) && navigator.onLine && ownershipUnlocked`, not online alone. Show “No API” when Pages baked empty `VITE_API_BASES`.
4. **Prove:** `pnpm test:pazaak-webui-e2e` (ensure-guest + enqueue + pair + forfeit) and two tabs `?devUser=player-a|player-b` against `:4001`.

## Examples

```bash
pnpm dev:pazaak-api
pnpm dev:pazaak-world
# http://localhost:5173/?devUser=player-a  and  ?devUser=player-b → Find Match
```

```bash
# Pages live multiplayer (after Worker deploy)
gh variable set PAZAAK_API_BASES --repo oldrepublicwizard/pazaak-world \
  --body 'https://pazaak-matchmaking.<account>.workers.dev'
```

## Related

- `docs/solutions/runtime-errors/github-pages-same-origin-api-bases.md`
- `docs/ops/holowan-oauth-and-api-bases.md`
- `docs/solutions/conventions/holowan-guest-local-ai-without-chitin.md`
