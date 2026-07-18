import assert from "node:assert/strict";
import test from "node:test";

import { loadDiscordRuntimeConfig, loadPazaakBotConfig, loadPazaakOpsPolicyForNode } from "./index.js";

const discordEnv = {
  PAZAAK_DISCORD_APP_ID: "app-1",
  PAZAAK_DISCORD_PUBLIC_KEY: "pub-1",
  PAZAAK_DISCORD_BOT_TOKEN: "token-1",
};

test("loadDiscordRuntimeConfig requires Discord credentials", () => {
  assert.throws(() => loadDiscordRuntimeConfig("PAZAAK", {}), /PAZAAK_DISCORD_APP_ID/);
});

test("loadPazaakBotConfig defaults to Holowan Pages origin", () => {
  const cfg = loadPazaakBotConfig({ ...discordEnv });
  assert.equal(cfg.activityUrl, "https://oldrepublicwizard.github.io/pazaak-world/");
  assert.equal(cfg.publicWebOrigin, "https://oldrepublicwizard.github.io/pazaak-world/");
  assert.equal(cfg.apiPort, 4001);
  assert.equal(cfg.allowDevAuth, false);
  assert.equal(cfg.apiOnly, false);
  assert.equal(cfg.dataDir, "data/pazaak-bot");
});

test("loadPazaakBotConfig PAZAAK_API_ONLY softens Discord and enables dev auth", () => {
  const cfg = loadPazaakBotConfig({ PAZAAK_API_ONLY: "true" });
  assert.equal(cfg.apiOnly, true);
  assert.equal(cfg.allowDevAuth, true);
  assert.equal(cfg.discord.appId, "local-dev");
  assert.equal(cfg.discord.botToken, "local-dev-no-discord");
});

test("loadPazaakBotConfig honors env overrides", () => {
  const cfg = loadPazaakBotConfig({
    ...discordEnv,
    PAZAAK_API_PORT: "4100",
    PAZAAK_ALLOW_DEV_AUTH: "true",
    PAZAAK_ACTIVITY_URL: "https://example.test/pazaak/",
    PAZAAK_PUBLIC_WEB_ORIGIN: "https://example.test/pazaak/",
    PAZAAK_STARTING_CREDITS: "2500",
  });
  assert.equal(cfg.apiPort, 4100);
  assert.equal(cfg.allowDevAuth, true);
  assert.equal(cfg.activityUrl, "https://example.test/pazaak/");
  assert.equal(cfg.startingCredits, 2500);
});

test("loadPazaakOpsPolicyForNode merges legacy timer env", () => {
  const policy = loadPazaakOpsPolicyForNode({
    PAZAAK_TURN_TIMER_SECONDS: "45",
    PAZAAK_MATCHMAKING_TICK_MS: "1500",
  });
  assert.equal(policy.timers.turnTimerSeconds, 45);
  assert.equal(policy.matchmaking.tickMs, 1500);
});
