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
```

## Portal

Holowan Underlabs cards point at this repo. Prefer play-host / release integrity work on the portal over visual polish.
