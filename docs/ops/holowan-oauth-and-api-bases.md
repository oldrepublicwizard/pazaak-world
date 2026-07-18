---
module: docs/ops
date: 2026-07-18
problem_type: workflow_issue
component: oauth-api-bases
severity: high
tags:
  - holowan
  - oauth
  - discord
  - github-pages
  - cloudflare-worker
---

# Holowan OAuth + `PAZAAK_API_BASES` cutover

## Local multiplayer without Discord

```bash
pnpm dev:pazaak-api          # :4001 HTTP/WS, ensure-guest + Match/Lobby
pnpm dev:pazaak-world        # :5173 Vite (proxies /api → :4001)
# Open two tabs: ?devUser=player-a and ?devUser=player-b → Find Match
```

`POST /api/auth/ensure-guest` (bot + Worker) upgrades browser `guest-*` ids to app sessions so guest Match works without OAuth.

---

## Why this exists

Live SPA is on GitHub Pages (`oldrepublicwizard.github.io/pazaak-world`). Pages is **static** — it cannot receive OAuth callbacks or serve `/api/*`. Multiplayer and sign-in need a separate API origin (pazaak-bot or `pazaak-matchmaking` Worker).

## Target URLs

| Role | URL |
|------|-----|
| SPA / Activity return | `https://oldrepublicwizard.github.io/pazaak-world/` |
| Local API (dev) | `http://127.0.0.1:4001` |
| Worker (prod candidate) | `https://pazaak-matchmaking.<account>.workers.dev` (after Cloudflare deploy) |

### Discord Developer Portal — redirect URIs

Register on the **API host**, not Pages:

```
http://127.0.0.1:4001/api/auth/oauth/discord/callback
https://pazaak-matchmaking.<account>.workers.dev/api/auth/oauth/discord/callback
```

Activity Interactions Endpoint / Linked Roles stay on the bot/Worker as documented by Discord.

**Anti-pattern:** `https://oldrepublicwizard.github.io/pazaak-world/api/auth/oauth/.../callback` — always 404.

## GitHub Actions wiring

```bash
# Pages build injects VITE_API_BASES from this variable:
gh variable set PAZAAK_API_BASES --repo oldrepublicwizard/pazaak-world \
  --body 'https://pazaak-matchmaking.<account>.workers.dev'

# Optional Discord Activity app id baked into the SPA:
gh variable set PAZAAK_DISCORD_APP_ID --repo oldrepublicwizard/pazaak-world --body '<app_id>'

# Worker deploy (skips until both present):
gh secret set CLOUDFLARE_API_TOKEN --repo oldrepublicwizard/pazaak-world
gh secret set CLOUDFLARE_ACCOUNT_ID --repo oldrepublicwizard/pazaak-world
```

Worker Discord secrets (via wrangler after CF account linked):

```bash
pnpm dlx wrangler secret put DISCORD_CLIENT_ID --config infra/pazaak-matchmaking-worker/wrangler.toml
pnpm dlx wrangler secret put DISCORD_CLIENT_SECRET --config infra/pazaak-matchmaking-worker/wrangler.toml
pnpm dlx wrangler secret put DISCORD_BOT_TOKEN --config infra/pazaak-matchmaking-worker/wrangler.toml
```

Set Worker `PUBLIC_WEB_ORIGIN` to `https://oldrepublicwizard.github.io/pazaak-world` (see `wrangler.toml`).

## Local check

```bash
node scripts/check_pazaak_oauth_readiness.mjs --checklist
# with bot running:
pnpm check:pazaak-oauth
```

## Ownership / chitin

Holowan default: `CARDWORLD_REQUIRE_CHITIN_KEY=0` — guests play local AI and online Match/Lobby without uploading `chitin.key`. Re-enable with `=1` if product policy changes.
