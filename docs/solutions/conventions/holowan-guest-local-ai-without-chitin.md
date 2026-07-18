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
  - oauth
---

# Holowan guests: no chitin.key for local or online surfaces

## Decision

| Surface | Gate |
|---------|------|
| Local AI Pazaak | Always open (`surface: local_ai`) |
| Online Match / Lobby | Open by default (`pazaakRequiresOwnershipProof: false` / `CARDWORLD_REQUIRE_CHITIN_KEY=0`) |
| Blackjack | Still available |

Re-gate online with `CARDWORLD_REQUIRE_CHITIN_KEY=1` or API `pazaakRequiresOwnershipProof: true` if policy changes.

## Related

- Access helper: `@pazaak/platform` `isPazaakAccessAllowed`
- OAuth / API cutover: `docs/ops/holowan-oauth-and-api-bases.md`
