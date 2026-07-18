---
title: Worker match/me must proxy MATCH_ACTOR after queue pairing
date: 2026-07-18
category: runtime-errors
module: infra/pazaak-matchmaking-worker
problem_type: runtime_error
component: authentication
symptoms:
  - "Matchmaking enqueue removes both guests from the queue but GET /api/match/me returns 404"
  - "Lobby start returns a match snapshot while Find Match never surfaces an active match"
root_cause: incomplete_setup
resolution_type: code_fix
severity: critical
tags:
  - cloudflare-worker
  - matchmaking
  - match-actor
  - durable-objects
  - holowan
---

# Worker match/me must proxy MATCH_ACTOR after queue pairing

## Problem

`tryPairMatchmakingQueue` created a `MATCH_ACTOR` Durable Object and cleared the queue, but `MatchCoordinator` still answered `GET /api/match/me` and `GET /api/match/:id` with hard-coded 404 stubs. The SPA only speaks `/api/match/*` (bot parity), so production Find Match appeared to pair then vanish.

## Symptoms

- Two `ensure-guest` sessions enqueue successfully; `/api/matchmaking/status` becomes `queue: null` for both.
- `/api/match/me` stays `{"error":"No active match"}`.
- Lobby join-by-code works; lobby start can return a snapshot while quick match does not.

## What Didn't Work

- Longer polling — pairing already succeeded inside the DO.
- Assuming `/api/matches/:id/state` would be enough — the SPA never calls that path.

## Solution

1. Persist `activeMatchesByUserId` on coordinator storage when queue pairing or lobby start creates a match.
2. Implement `/api/match/me` by resolving the user’s match id and reading `MATCH_ACTOR` `/state`.
3. Proxy `/api/match/:id` plus `draw` / `stand` / `endturn` / `play` / `forfeit` to `MATCH_ACTOR` `/command`.

## Why This Works

Match authority lives in per-match Durable Objects. The coordinator must keep a user→matchId index and translate the bot HTTP surface onto those actors.

## Prevention

- Smoke two guests against the Worker after every deploy: ensure-guest → enqueue → `/api/match/me` 200.
- Do not leave stub `return error("No active match", 404)` routes once `workerMatchAuthority` is enabled.

## Related Issues

- `docs/solutions/developer-experience/guest-ensure-guest-and-api-only-local.md`
- `docs/ops/holowan-oauth-and-api-bases.md`
