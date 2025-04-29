#!/usr/bin/env node

import esbuild from "esbuild";
import path from "path";
import fs from "fs";
import chokidar from "chokidar";
import express from "express";
import chalk from "chalk";

// CLI arg parsing (minimal)
function parseArgs() {
  const args = process.argv.slice(2);
  const opts: Record<string, string | boolean> = {};
  let mode = "dev";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "dev" || args[i] === "build") {
      mode = args[i];
    } else if (args[i].startsWith("--")) {
      const [key, val] = args[i].replace(/^--/, "").split("=");
      opts[key] = val === undefined ? true : val;
    }
  }
  return { mode, opts };
}

const { mode, opts } = parseArgs();
const SRC_DIR = path.resolve(process.cwd(), (opts.src as string) || "src");
const DEV_DIR = path.resolve(process.cwd(), (opts.out as string) || "dev");
const DIST_DIR = path.resolve(process.cwd(), (opts.out as string) || "dist");
const PORT = 3000;

// Helper: Get all .ts and .js entry points in src/
function getEntryPoints(): string[] {
  function walk(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walk(fullPath);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".ts") || entry.name.endsWith(".js"))
      ) {
        return [fullPath];
      } else {
        return [];
      }
    });
  }
  return walk(SRC_DIR);
}

// Build one entry
async function buildEntry(
  entry: string,
  outDir: string,
  prod: boolean = false
) {
  const relPath = path.relative(SRC_DIR, entry);
  // Replace .ts or .js with .js for output
  const jsOut = path.join(outDir, relPath.replace(/\.(ts|js)$/, ".js"));
  // Ensure output subdirectory exists
  const jsOutDir = path.dirname(jsOut);
  if (!fs.existsSync(jsOutDir)) {
    fs.mkdirSync(jsOutDir, { recursive: true });
  }
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    outfile: jsOut,
    format: "iife",
    minify: prod,
    sourcemap: !prod,
    metafile: true,
    logLevel: "silent",
    drop: prod ? ["console", "debugger"] : undefined,
  });
}

// Build all entries
async function buildAll(outDir: string, prod: boolean = false) {
  ensureDir(outDir);
  const entries = getEntryPoints();
  await Promise.all(entries.map((e) => buildEntry(e, outDir, prod)));
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Watch mode: only rebuild changed file
function watch(outDir: string) {
  ensureDir(outDir);
  const watcher = chokidar.watch([`${SRC_DIR}/**/*.ts`, `${SRC_DIR}/**/*.js`]);
  function flowscriptLog(action: string, file: string) {
    const now = new Date();
    const timestamp = now.toLocaleTimeString("en-US", { hour12: true });
    // Compute served path (strip SRC_DIR, replace .ts with .js)
    let relPath = path.relative(SRC_DIR, file).replace(/\\/g, "/");
    let servedPath = relPath.replace(/\.ts$/, ".js");
    if (!servedPath.startsWith("/")) servedPath = "/" + servedPath;
    const link = `http://localhost:${PORT}${servedPath}`;
    console.log(
      chalk.dim(`${timestamp}`) +
        chalk.cyan.bold(` [flowscript]`) +
        chalk.dim(` script`) +
        chalk.rgb(21, 110, 245).bold(` ${action}`) +
        // Show relPath as a clickable link (ANSI hyperlink), styled dim
        ` \u001b]8;;${link}\u0007${chalk.dim(relPath)}\u001b]8;;\u0007`
    );
  }

  watcher.on("change", async (file) => {
    if (file.endsWith(".ts") || file.endsWith(".js")) {
      await buildEntry(file, outDir);
      flowscriptLog("rebuilt", file);
    }
  });
  watcher.on("add", async (file) => {
    if (file.endsWith(".ts") || file.endsWith(".js")) {
      await buildEntry(file, outDir);
      flowscriptLog("added", file);
    }
  });
  watcher.on("unlink", async (file) => {
    const base = path.basename(file, path.extname(file));
    const jsOut = path.join(outDir, `${base}.js`);
    if (fs.existsSync(jsOut)) fs.unlinkSync(jsOut);
    flowscriptLog("removed", file);
  });
}

// Serve dist/ on localhost:3000
function serve(outDir: string, readyMs?: number) {
  const app = express();
  app.use(express.static(outDir));
  const start = Date.now();
  app.listen(PORT, () => {
    const elapsed = readyMs ?? Date.now() - start;
    // Vite-style CLI output
    console.log();
    console.log(
      chalk.rgb(21, 110, 245).bold("  FlowScript") +
        chalk.dim("  ready in ") +
        chalk.white.bold(elapsed) +
        chalk.white(" ms")
    );
    console.log();
    console.log(
      chalk.cyan("  ➜") +
        chalk.white.bold(`  Local:`) +
        chalk.cyan(` http://localhost:${PORT}/`)
    );
    console.log();
  });
}

// Entrypoint
async function main() {
  if (mode === "dev") {
    const start = Date.now();
    await buildAll(DEV_DIR, false);
    const readyMs = Date.now() - start;
    watch(DEV_DIR);
    serve(DEV_DIR, readyMs);
  } else if (mode === "build") {
    await buildAll(DIST_DIR, true);
    console.log(`Production build complete. Files are in ${DIST_DIR}/.`);
  } else {
    console.error(`Unknown mode: ${mode}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
