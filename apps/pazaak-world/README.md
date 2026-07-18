# pazaak-world

Holowan Multiplayer Pazaak browser client. Runs as a standalone SPA (GitHub Pages) and as a
Discord Embedded App Activity. Talks to the HTTP/WebSocket API from `pazaak-bot` (or the
Cloudflare matchmaking Worker).

Live: https://oldrepublicwizard.github.io/pazaak-world/

## Stack

- Vite 8 + React 19 + TypeScript
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- `@discord/embedded-app-sdk` for OAuth2 and Activity lifecycle

## Local development (recommended)

API-only backend (no Discord tokens required):

```bash
# Terminal 1 — matchmaking + auth API on :4001
pnpm dev:pazaak-api

# Terminal 2 — Vite SPA on :5173 (proxies /api and /ws to :4001)
pnpm dev:pazaak-world
```

Open two browsers:

- http://localhost:5173/?devUser=player-a
- http://localhost:5173/?devUser=player-b

Then use **Find Match** on both. Guests without `?devUser=` call `POST /api/auth/ensure-guest`.

Full Discord bot (requires secrets from `.env.example`):

```bash
pnpm dev:pazaak
pnpm dev:pazaak-world
```

Or set `PAZAAK_API_ONLY=1` so `pnpm dev:pazaak` starts the API and skips Discord gateway login.

## GitHub Pages

Static hosting has no reverse proxy. Multiplayer needs HTTPS API bases at build time:

- Repo variable `PAZAAK_API_BASES` → baked into `VITE_API_BASES`
- OAuth callbacks must hit the Worker/bot host, never `*.github.io/.../api/...`

Without `PAZAAK_API_BASES`, Match / Lobby stay disabled and local AI remains playable.

See `docs/ops/holowan-oauth-and-api-bases.md`.

## Account sessions

- `POST /api/auth/ensure-guest` — browser guest id → app session
- `POST /api/auth/register` / `login` — password accounts
- `GET /api/auth/session` — Bearer app token
- Discord Activity still uses `/api/auth/token` for the Embedded App SDK exchange

## Build

```bash
pnpm --filter pazaak-world build
```

Deploy `dist/` to any static host. Canonical production URL:

`https://oldrepublicwizard.github.io/pazaak-world/`

Register that URL in the Discord Developer Portal (Activities → URL Mappings) and use it for
`PAZAAK_ACTIVITY_URL` plus `PAZAAK_PUBLIC_WEB_ORIGIN`.
