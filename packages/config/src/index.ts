import { config as loadDotEnv } from "dotenv";
import { z } from "zod";

loadDotEnv();

const defaultChatModel = "gpt-5.4-mini";
const defaultEmbeddingModel = "text-embedding-3-large";

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

const readListEnv = (name: string, env: NodeJS.ProcessEnv = process.env): string[] => {
  const value = readOptionalEnv(name, env);

  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export interface DiscordRuntimeConfig {
  appId: string;
  publicKey: string;
  botToken: string;
  guildId: string | undefined;
}

export interface SharedAiConfig {
  openAiApiKey: string | undefined;
  firecrawlApiKey: string | undefined;
  chatModel: string;
  embeddingModel: string;
  databaseUrl: string | undefined;
}

export interface TraskBotConfig {
  discord: DiscordRuntimeConfig;
  ai: SharedAiConfig;
  allowedGuildIds: string[];
  approvedChannelIds: string[];
  chunkDir: string;
}

export interface HkBotConfig {
  discord: DiscordRuntimeConfig;
  dataDir: string;
}

export interface DeadeyeBotConfig {
  discord: DiscordRuntimeConfig;
  dataDir: string;
  startingCredits: number;
  dailyBonusCredits: number;
  dailyCooldownMs: number;
  turnTimeoutMs: number;
}

export interface IngestWorkerConfig {
  ai: SharedAiConfig;
  stateDir: string;
}

export const loadDiscordRuntimeConfig = (
  prefix: string,
  env: NodeJS.ProcessEnv = process.env,
): DiscordRuntimeConfig => {
  return {
    appId: readRequiredEnv(`${prefix}_DISCORD_APP_ID`, env),
    publicKey: readRequiredEnv(`${prefix}_DISCORD_PUBLIC_KEY`, env),
    botToken: readRequiredEnv(`${prefix}_DISCORD_BOT_TOKEN`, env),
    guildId: readOptionalEnv(`${prefix}_DISCORD_GUILD_ID`, env) ?? readOptionalEnv("DISCORD_TARGET_GUILD_ID", env),
  };
};

export const loadSharedAiConfig = (env: NodeJS.ProcessEnv = process.env): SharedAiConfig => {
  return {
    openAiApiKey: readOptionalEnv("OPENAI_API_KEY", env),
    firecrawlApiKey: readOptionalEnv("FIRECRAWL_API_KEY", env),
    chatModel: readOptionalEnv("OPENAI_CHAT_MODEL", env) ?? defaultChatModel,
    embeddingModel: readOptionalEnv("OPENAI_EMBEDDING_MODEL", env) ?? defaultEmbeddingModel,
    databaseUrl: readOptionalEnv("DATABASE_URL", env),
  };
};

export const loadTraskBotConfig = (env: NodeJS.ProcessEnv = process.env): TraskBotConfig => {
  return {
    discord: loadDiscordRuntimeConfig("TRASK", env),
    ai: loadSharedAiConfig(env),
    allowedGuildIds: readListEnv("TRASK_ALLOWED_GUILD_IDS", env),
    approvedChannelIds: readListEnv("TRASK_APPROVED_CHANNEL_IDS", env),
    chunkDir: readOptionalEnv("INGEST_STATE_DIR", env) ?? "data/ingest-worker",
  };
};

export const loadHkBotConfig = (env: NodeJS.ProcessEnv = process.env): HkBotConfig => {
  return {
    discord: loadDiscordRuntimeConfig("HK", env),
    dataDir: readOptionalEnv("HK_DATA_DIR", env) ?? "data/hk-bot",
  };
};

export const loadDeadeyeBotConfig = (env: NodeJS.ProcessEnv = process.env): DeadeyeBotConfig => {
  return {
    discord: loadDiscordRuntimeConfig("DEADEYE", env),
    dataDir: readOptionalEnv("DEADEYE_DATA_DIR", env) ?? "data/deadeye-duncan",
    startingCredits: integerish.parse(readOptionalEnv("DEADEYE_STARTING_CREDITS", env) ?? "1000"),
    dailyBonusCredits: integerish.parse(readOptionalEnv("DEADEYE_DAILY_BONUS", env) ?? "200"),
    dailyCooldownMs: integerish.parse(readOptionalEnv("DEADEYE_DAILY_COOLDOWN_MS", env) ?? "86400000"),
    turnTimeoutMs: integerish.parse(readOptionalEnv("DEADEYE_TURN_TIMEOUT_MS", env) ?? "300000"),
  };
};

export const loadIngestWorkerConfig = (env: NodeJS.ProcessEnv = process.env): IngestWorkerConfig => {
  return {
    ai: loadSharedAiConfig(env),
    stateDir: readOptionalEnv("INGEST_STATE_DIR", env) ?? "data/ingest-worker",
  };
};