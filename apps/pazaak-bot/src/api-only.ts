/**
 * HTTP/WS API-only entry for local multiplayer without Discord credentials.
 *
 *   PAZAAK_ALLOW_DEV_AUTH=true pnpm --filter @pazaak/pazaak-bot dev:api
 *   # or from repo root: pnpm dev:pazaak-api
 */
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { PazaakCoordinator } from "@pazaak/pazaak-engine";
import {
  JsonPazaakAccountRepository,
  JsonPazaakLobbyRepository,
  JsonPazaakMatchHistoryRepository,
  JsonPazaakMatchmakingQueueRepository,
  JsonPazaakSideboardRepository,
  JsonWalletRepository,
} from "@pazaak/persistence";

import { createApiServer } from "./api-server.js";

const port = Number(process.env.PAZAAK_API_PORT ?? "4001");
const dataDir = resolve(process.env.PAZAAK_DATA_DIR ?? process.env.PAZAAK_WEBUI_TEST_DATA_DIR ?? "data/pazaak-api-only");
const publicWebOrigin = process.env.PAZAAK_PUBLIC_WEB_ORIGIN?.trim() || "http://localhost:5173";
const activityOrigin = process.env.PAZAAK_ACTIVITY_URL?.trim() || publicWebOrigin;
const pazaakRequiresOwnershipProof = (process.env.CARDWORLD_REQUIRE_CHITIN_KEY?.trim() ?? "0") !== "0";

await mkdir(dataDir, { recursive: true });

const accountRepository = new JsonPazaakAccountRepository(resolve(dataDir, "accounts.json"));
const walletRepository = new JsonWalletRepository(resolve(dataDir, "wallets.json"), 1000);
const sideboardRepository = new JsonPazaakSideboardRepository(resolve(dataDir, "sideboards.json"));
const queueRepository = new JsonPazaakMatchmakingQueueRepository(resolve(dataDir, "queue.json"));
const lobbyRepository = new JsonPazaakLobbyRepository(resolve(dataDir, "lobbies.json"));
const historyRepository = new JsonPazaakMatchHistoryRepository(resolve(dataDir, "history.json"));

const coordinator = new PazaakCoordinator(undefined, {
  turnTimeoutMs: 45_000,
  disconnectForfeitMs: 30_000,
});

const { server, listen } = createApiServer(coordinator, {
  port,
  discordAppId: process.env.PAZAAK_DISCORD_APP_ID?.trim() || "local-dev",
  discordClientSecret: process.env.PAZAAK_DISCORD_CLIENT_SECRET?.trim(),
  activityOrigin,
  publicWebOrigin,
  accountRepository,
  walletRepository,
  sideboardRepository,
  matchmakingQueueRepository: queueRepository,
  lobbyRepository,
  matchHistoryRepository: historyRepository,
  pazaakRequiresOwnershipProof,
  matchmakingTickMs: 250,
  allowDevAuth: true,
});

listen();

const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log(`[pazaak-api] listening on http://127.0.0.1:${port}`);
console.log(`[pazaak-api] data dir: ${dataDir}`);
console.log("[pazaak-api] Dev auth on — use ?devUser=player-a / player-b, or guest ensure-guest.");
