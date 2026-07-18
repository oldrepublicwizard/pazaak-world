---
module: apps/pazaak-world
date: 2026-07-18
problem_type: convention
component: cardworld-unlock
severity: medium
tags:
  - holowan
  - chitin-key
  - guest-play
  - github-pages
---

# Guest local AI Pazaak without chitin.key

## Decision

Holowan public Pages must be **honestly playable** as Multiplayer Pazaak marketing:

| Surface | Gate |
|---------|------|
| Local AI Pazaak | Always open (no `chitin.key`) |
| Online Match / Lobby | Still requires ownership proof when `pazaakRequiresOwnershipProof` is true |
| Blackjack | Remains available as alternate practice |

## Implementation

`@pazaak/platform` → `isPazaakAccessAllowed({ surface: "local_ai" | "online", ... })`.

`App.tsx` routes `onStartLocalGame` through the local surface; online buttons keep the online surface.

## Verification

```bash
pnpm --filter @pazaak/platform build
node --test packages/platform/dist/utils.test.js
# After Pages deploy: Challenge Selected → local board (not Blackjack redirect)
```
