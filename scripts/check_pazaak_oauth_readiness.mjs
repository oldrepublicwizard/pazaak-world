#!/usr/bin/env node

/**
 * OAuth readiness for Holowan Multiplayer Pazaak.
 *
 *   node scripts/check_pazaak_oauth_readiness.mjs --checklist   # always exit 0; print ops cutover
 *   node scripts/check_pazaak_oauth_readiness.mjs               # local .env + optional :4001 probe
 */

import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, ".env");
const checklistOnly = process.argv.includes("--checklist");

const HOLOWAN_PAGES = "https://oldrepublicwizard.github.io/pazaak-world";
const LOCAL_API = "http://127.0.0.1:4001";

const PROVIDERS = [
  {
    name: "google",
    vars: [
      "PAZAAK_OAUTH_GOOGLE_CLIENT_ID",
      "PAZAAK_OAUTH_GOOGLE_CLIENT_SECRET",
      "PAZAAK_OAUTH_GOOGLE_CALLBACK_URL",
    ],
  },
  {
    name: "discord",
    vars: [
      "PAZAAK_OAUTH_DISCORD_CLIENT_ID",
      "PAZAAK_OAUTH_DISCORD_CLIENT_SECRET",
      "PAZAAK_OAUTH_DISCORD_CALLBACK_URL",
    ],
    fallbackVars: {
      PAZAAK_OAUTH_DISCORD_CLIENT_ID: ["PAZAAK_DISCORD_APP_ID"],
      PAZAAK_OAUTH_DISCORD_CLIENT_SECRET: ["PAZAAK_DISCORD_CLIENT_SECRET"],
    },
  },
  {
    name: "github",
    vars: [
      "PAZAAK_OAUTH_GITHUB_CLIENT_ID",
      "PAZAAK_OAUTH_GITHUB_CLIENT_SECRET",
      "PAZAAK_OAUTH_GITHUB_CALLBACK_URL",
    ],
  },
];

const parseDotEnv = (content) => {
  const out = new Map();
  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const eq = line.indexOf("=");
    if (eq <= 0) {
      continue;
    }

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\""))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    out.set(key, value);
  }
  return out;
};

const readEnv = () => {
  if (!fs.existsSync(envPath)) {
    return new Map();
  }

  const content = fs.readFileSync(envPath, "utf8");
  return parseDotEnv(content);
};

const hasValue = (vars, key) => {
  const fromProcess = process.env[key];
  if (typeof fromProcess === "string" && fromProcess.trim().length > 0) {
    return true;
  }
  const fromEnvFile = vars.get(key);
  return typeof fromEnvFile === "string" && fromEnvFile.trim().length > 0;
};

const resolveValue = (vars, key) => {
  const fromProcess = process.env[key]?.trim();
  if (fromProcess) {
    return fromProcess;
  }
  return (vars.get(key) || "").trim();
};

const callbackLooksLocal = (vars, key, provider) => {
  const fallback = `http://localhost:4001/api/auth/oauth/${provider}/callback`;
  const alt = `http://127.0.0.1:4001/api/auth/oauth/${provider}/callback`;
  const value = resolveValue(vars, key);
  return value.length > 0 && (value === fallback || value === alt);
};

const callbackPointsAtPages = (vars, key) => {
  const value = resolveValue(vars, key).toLowerCase();
  return value.includes("github.io");
};

const checkProviderVars = (provider, vars) => {
  const missing = [];

  for (const key of provider.vars) {
    let ok = hasValue(vars, key);
    if (!ok && provider.fallbackVars?.[key]) {
      ok = provider.fallbackVars[key].some((fallback) => hasValue(vars, fallback));
    }
    if (!ok) {
      missing.push(key);
    }
  }

  const callbackKey = provider.vars[2];
  return {
    missing,
    callbackLocal: callbackLooksLocal(vars, callbackKey, provider.name),
    callbackOnPages: callbackPointsAtPages(vars, callbackKey),
  };
};

const fetchProviderStatus = async (apiBase = LOCAL_API) => {
  try {
    const res = await fetch(`${apiBase.replace(/\/$/u, "")}/api/auth/oauth/providers`);
    if (!res.ok) {
      return { ok: false, reason: `HTTP ${res.status}` };
    }
    const json = await res.json();
    return { ok: true, data: json };
  } catch (error) {
    return { ok: false, reason: String(error) };
  }
};

const print = (line = "") => {
  process.stdout.write(`${line}\n`);
};

const printChecklist = () => {
  print("Holowan OAuth + API bases checklist");
  print("===================================");
  print(`SPA / return origin: ${HOLOWAN_PAGES}/`);
  print(`Local API:           ${LOCAL_API}`);
  print("");
  print("Discord redirect URIs (API host — not Pages):");
  print(`  ${LOCAL_API}/api/auth/oauth/discord/callback`);
  print("  https://pazaak-matchmaking.<account>.workers.dev/api/auth/oauth/discord/callback");
  print("");
  print("Anti-pattern (always broken):");
  print(`  ${HOLOWAN_PAGES}/api/auth/oauth/discord/callback`);
  print("");
  print("GitHub repo (oldrepublicwizard/pazaak-world):");
  print("  gh variable set PAZAAK_API_BASES --body 'https://pazaak-matchmaking.<account>.workers.dev'");
  print("  gh secret set CLOUDFLARE_API_TOKEN");
  print("  gh secret set CLOUDFLARE_ACCOUNT_ID");
  print("");
  print("Docs: docs/ops/holowan-oauth-and-api-bases.md");
  print("");
};

const main = async () => {
  printChecklist();
  if (checklistOnly) {
    print("RESULT: checklist printed (--checklist). Secrets not required for this mode.");
    return;
  }

  const envVars = readEnv();

  print("Local .env probe");
  print("----------------");
  print(`.env path: ${envPath}`);
  if (!fs.existsSync(envPath)) {
    print("WARNING: .env file not found. Only process environment variables will be checked.");
  }
  print("");

  let anyMissing = false;
  let anyPagesCallback = false;

  for (const provider of PROVIDERS) {
    const { missing, callbackLocal, callbackOnPages } = checkProviderVars(provider, envVars);
    print(`[${provider.name}]`);
    print(`  required vars present: ${missing.length === 0 ? "yes" : "no"}`);
    if (missing.length > 0) {
      anyMissing = true;
      print(`  missing: ${missing.join(", ")}`);
    }
    print(`  callback is localhost: ${callbackLocal ? "yes" : "no"}`);
    if (callbackOnPages) {
      anyPagesCallback = true;
      print("  ERROR: callback points at github.io — OAuth will 404. Point at bot/Worker instead.");
    }
    print("");
  }

  if (anyPagesCallback) {
    process.exitCode = 4;
  }

  const status = await fetchProviderStatus();
  print("Live API status (/api/auth/oauth/providers)");
  print("-------------------------------------------");
  if (!status.ok) {
    print(`could not query local API: ${status.reason}`);
    print("Make sure pnpm dev:pazaak is running on :4001 (or pass a live Worker URL later).");
    print("");
    print(anyMissing
      ? "RESULT: BLOCKED — fill .env secrets, then start the bot API."
      : "RESULT: BLOCKED_ON_API — env may be OK; bot/Worker not reachable.");
    process.exitCode = process.exitCode || (anyMissing ? 2 : 1);
    return;
  }

  const providers = Array.isArray(status.data?.providers) ? status.data.providers : [];
  for (const provider of providers) {
    print(`  ${provider.provider}: ${provider.enabled ? "ENABLED" : "DISABLED"}`);
  }

  const allEnabled = providers.length > 0 && providers.every((provider) => provider.enabled);
  print("");
  if (anyPagesCallback) {
    print("RESULT: FAIL — fix github.io callback URLs before enabling providers.");
    return;
  }
  print(allEnabled ? "RESULT: all configured providers are enabled." : "RESULT: one or more providers are still disabled.");

  if (!allEnabled) {
    print("Next steps:");
    print("  1. Fill any missing env vars shown above");
    print("  2. Restart pnpm dev:pazaak");
    print("  3. Re-run this checker");
    print("  4. For Pages multiplayer: set PAZAAK_API_BASES + Cloudflare secrets (see checklist)");
    process.exitCode = 2;
  }
};

await main();
