import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(root, "../..");
const entry = resolve(root, "src/index.ts");
const outfile = resolve(root, "../../infra/nakama/modules/pazaak-world.js");
const watch = process.argv.includes("--watch");

await mkdir(dirname(outfile), { recursive: true });

const options: esbuild.BuildOptions = {
  entryPoints: [entry],
  outfile,
  bundle: true,
  platform: "neutral",
  target: "es2020",
  // Nakama's loader parses the program AST and requires a top-level `function InitModule` (not inside an IIFE).
  format: "cjs",
  alias: {
    "@pazaak/pazaak-tournament": resolve(repoRoot, "packages/pazaak-tournament/src/nakama-entry.ts"),
    "node:crypto": resolve(dirname(fileURLToPath(import.meta.url)), "node-crypto-stub.ts"),
  },
  // Nakama loads the single JS file only; an external .map next to it causes startup failure.
  sourcemap: false,
  logLevel: "info",
  legalComments: "none",
  banner: {
    // Node/CommonJS provides `module`/`exports`; Nakama's VM does not — define only when missing (no shadowing).
    js: [
      "if (typeof module === \"undefined\") {",
      "  var module = { exports: {} };",
      "}",
      "if (typeof exports === \"undefined\") {",
      "  var exports = module.exports;",
      "}",
    ].join("\n"),
  },
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log(`Watching Nakama runtime -> ${outfile}`);
} else {
  await esbuild.build(options);
}
