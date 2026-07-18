import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import {
  deepMergePolicy,
  loadPazaakOpsPolicy,
  type PazaakOpsPolicy,
} from "@pazaak/pazaak-policy";

export type { PazaakOpsPolicy } from "@pazaak/pazaak-policy";
import { loadPolicyFromFile } from "@pazaak/pazaak-policy/file-loader";
import { config as loadDotEnv } from "dotenv";
import { z } from "zod";

function findRepoEnvDir(startDir: string = process.cwd()): string | undefined {
  let dir = resolve(startDir);
  for (;;) {
    if (existsSync(join(dir, ".env")) || existsSync(join(dir, ".env.local"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

const envDir = findRepoEnvDir();
if (envDir) {
  const dotEnvPath = join(envDir, ".env");
  const dotEnvLocalPath = join(envDir, ".env.local");
  if (existsSync(dotEnvPath)) {
    loadDotEnv({ path: dotEnvPath });
  } else {
    loadDotEnv();
  }
  if (existsSync(dotEnvLocalPath)) {
    loadDotEnv({ path: dotEnvLocalPath, override: true });
  }
} else {
  loadDotEnv();
}

const defaultPazaakWorldUrl = "https://oldrepublicwizard.github.io/pazaak-world/";

const integerish = z.coerce.number().int().nonnegative();

const readRequiredEnv = (name: string, env: NodeJS.ProcessEnv = process.env): string => {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable ${name}.`);
  }

  return value;
};

const readOptionalEnv = (name: string, env: NodeJS.ProcessEnv = process.env): string | undefined => {
  const value = env[name]?.trim();
  return value ? value : undefined;
};

const readBooleanEnv = (name: string, env: NodeJS.ProcessEnv = process.env): boolean | undefined => {
  const value = readOptionalEnv(name, env);
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on") return true;
  if (normalized === "0" || normalized === "false" || normalized === "no" || normalized === "off") return false;
  throw new Error(`Invalid boolean value for environment variable ${name}: ${value}`);
};

export interface DiscordRuntimeConfig {
  appId: string;
  clientSecret: string | undefined;
  publicKey: string;
  botToken: string;
  guildId: string | undefined;
}

export interface PazaakBotConfig {
  discord: DiscordRuntimeConfig;
  dataDir: string;
  startingCredits: number;
  dailyBonusCredits: number;
  dailyCooldownMs: number;
  turnTimeoutMs: number;
  /** Port for the embedded HTTP/WS API used by Activities and the browser UI. */
  apiPort: number;
  /** Public URL where the pazaak-world frontend is hosted (for the "Launch Activity" button link). */
  activityUrl: string;
  /** Public standalone website URL for CORS and OAuth redirect flows. */
  publicWebOrigin: string | undefined;
  /** Per-turn decision window for cross-platform clients. */
  turnTimerSeconds: number;
  /** Grace period before disconnected participants forfeit. */
  disconnectForfeitMs: number;
  /** Matchmaking queue scan cadence. */
  matchmakingTickMs: number;
  /** Enables local synthetic Bearer tokens (dev-user-*) for browser-only testing. */
  allowDevAuth: boolean;
  /** Unified YAML/JSON/env ops policy (`PAZAAK_POLICY_PATH`, `PAZAAK_POLICY_JSON`, `PAZAAK_POLICY__*` ). */
  opsPolicy: PazaakOpsPolicy;
}

/** Resolve ops policy for Node services (declarative file + env layers + legacy `PAZAAK_*` timers when set). */
export const loadPazaakOpsPolicyForNode = (env: NodeJS.ProcessEnv = process.env): PazaakOpsPolicy => {
  const path = readOptionalEnv("PAZAAK_POLICY_PATH", env)?.trim();
  const base = path && existsSync(path) ? loadPolicyFromFile(path) : undefined;
  let policy = loadPazaakOpsPolicy(env, base ? { basePolicy: base } : {});

  const legacyTimers: Record<string, number> = {};
  const tt = readOptionalEnv("PAZAAK_TURN_TIMER_SECONDS", env);
  if (tt) legacyTimers.turnTimerSeconds = integerish.parse(tt);
  const tm = readOptionalEnv("PAZAAK_TURN_TIMEOUT_MS", env);
  if (tm) legacyTimers.turnTimeoutMs = integerish.parse(tm);
  const df = readOptionalEnv("PAZAAK_DISCONNECT_FORFEIT_MS", env);
  if (df) legacyTimers.disconnectForfeitMs = integerish.parse(df);
  if (Object.keys(legacyTimers).length > 0) {
    policy = deepMergePolicy(policy, { timers: legacyTimers });
  }
  const mt = readOptionalEnv("PAZAAK_MATCHMAKING_TICK_MS", env);
  if (mt) {
    policy = deepMergePolicy(policy, { matchmaking: { tickMs: integerish.parse(mt) } });
  }
  return policy;
};

export const loadDiscordRuntimeConfig = (
  prefix: string,
  env: NodeJS.ProcessEnv = process.env,
): DiscordRuntimeConfig => {
  return {
    appId: readRequiredEnv(`${prefix}_DISCORD_APP_ID`, env),
    clientSecret: readOptionalEnv(`${prefix}_DISCORD_CLIENT_SECRET`, env),
    publicKey: readRequiredEnv(`${prefix}_DISCORD_PUBLIC_KEY`, env),
    botToken: readRequiredEnv(`${prefix}_DISCORD_BOT_TOKEN`, env),
    guildId: readOptionalEnv(`${prefix}_DISCORD_GUILD_ID`, env) ?? readOptionalEnv("DISCORD_TARGET_GUILD_ID", env),
  };
};

export const loadPazaakBotConfig = (env: NodeJS.ProcessEnv = process.env): PazaakBotConfig => {
  const opsPolicy = loadPazaakOpsPolicyForNode(env);
  return {
    discord: loadDiscordRuntimeConfig("PAZAAK", env),
    dataDir: readOptionalEnv("PAZAAK_DATA_DIR", env) ?? "data/pazaak-bot",
    startingCredits: integerish.parse(readOptionalEnv("PAZAAK_STARTING_CREDITS", env) ?? "1000"),
    dailyBonusCredits: integerish.parse(readOptionalEnv("PAZAAK_DAILY_BONUS", env) ?? "200"),
    dailyCooldownMs: integerish.parse(readOptionalEnv("PAZAAK_DAILY_COOLDOWN_MS", env) ?? "86400000"),
    turnTimeoutMs: opsPolicy.timers.turnTimeoutMs,
    apiPort: integerish.parse(readOptionalEnv("PAZAAK_API_PORT", env) ?? "4001"),
    activityUrl: readOptionalEnv("PAZAAK_ACTIVITY_URL", env) ?? defaultPazaakWorldUrl,
    publicWebOrigin: readOptionalEnv("PAZAAK_PUBLIC_WEB_ORIGIN", env) ?? defaultPazaakWorldUrl,
    turnTimerSeconds: opsPolicy.timers.turnTimerSeconds,
    disconnectForfeitMs: opsPolicy.timers.disconnectForfeitMs,
    matchmakingTickMs: opsPolicy.matchmaking.tickMs,
    allowDevAuth: readBooleanEnv("PAZAAK_ALLOW_DEV_AUTH", env) ?? false,
    opsPolicy,
  };
};
