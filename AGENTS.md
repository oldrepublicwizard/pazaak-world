# Agent guide — Holowan Multiplayer Pazaak (pazaak-world)

## Product

- Public name: **Holowan Multiplayer Pazaak**
- Repo / app: **Pazaak World** (`oldrepublicwizard/pazaak-world`)
- Supersedes desktop **HoloPazaak** for Holowan portal CTAs

## Scope

This monorepo is **Pazaak only**. Do not reintroduce Trask/HK hub routes or `/api/trask`.

## Verify

```bash
pnpm install
pnpm build
pnpm --filter @pazaak/pazaak-engine exec node --test dist/*.test.js 2>/dev/null || true
rg -i 'trask' apps packages --glob '!**/node_modules/**' --glob '!**/dist/**'; test $? -eq 1
./scripts/prove-pages-smoke.sh
pnpm check:pazaak-oauth:checklist
```

Live SPA: https://oldrepublicwizard.github.io/pazaak-world/  
Without `vars.PAZAAK_API_BASES`, Pages is **offline-static** (local AI playable; no `github.io/api/*` fetches). See `docs/solutions/runtime-errors/github-pages-same-origin-api-bases.md` and `docs/ops/holowan-oauth-and-api-bases.md`.

OAuth callbacks must hit the **bot/Worker**, never Pages. Holowan default: `CARDWORLD_REQUIRE_CHITIN_KEY=0`.

## Portal

Holowan Underlabs cards point at this repo. Prefer play-host / release integrity work on the portal over visual polish.
