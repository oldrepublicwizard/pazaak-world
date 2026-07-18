# Holowan Multiplayer Pazaak (Pazaak World)

Standalone Discord + browser multiplayer Pazaak for Holowan Underlabs.

- **Repo:** https://github.com/oldrepublicwizard/pazaak-world  
- **Live play:** https://oldrepublicwizard.github.io/pazaak-world/
- **Portal product name:** Holowan Multiplayer Pazaak  
- **App / crumb name:** Pazaak World  

This tree was extracted from the Pazaak apps inside the community-bots monorepo and **no longer mounts Trask or other Discord suite hubs**.

## Packages

| Path | Role |
|------|------|
| `apps/pazaak-bot` | Discord.js bot + authoritative HTTP/WS match API |
| `apps/pazaak-world` | Vite/React client (browser + Discord Activity) |
| `apps/pazaak-nakama` | Optional Nakama runtime build |
| `packages/pazaak-engine` | Shared rules / coordinator |
| `infra/pazaak-matchmaking-worker` | Cloudflare Worker failover / Activity helpers |

## Quick start

```bash
pnpm install
pnpm --filter @pazaak/pazaak-engine build
pnpm --filter @pazaak/pazaak-bot build
pnpm --filter pazaak-world build
```

Dev:

```bash
cp .env.example .env
pnpm dev:pazaak          # bot + API
pnpm dev:pazaak-world    # SPA
```

## Holowan notes

- Public Holowan portal must link here — not the retired HoloPazaak Qt prototype.
- Do not put banned portal brand tokens in Holowan Underlabs `site/` copy; this repo may mention technical origins in history only.
- Discord OAuth redirect URIs must match `PAZAAK_*` origins above before production Activity deploy.
