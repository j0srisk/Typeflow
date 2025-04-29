#!/usr/bin/env node

import path from "path";
import { buildAll } from "./build";
import { logBuildOutput } from "./output";
import { watch } from "./watch";
import { serve } from "./server";

// CLI arg parsing (minimal)
// Usage: flowscript dev|build [--src=srcdir] [--out=outdir] [--port=PORT]
function parseArgs() {
  const args = process.argv.slice(2);
  const opts: Record<string, string | boolean> = {};
  let mode = "dev";

  // Check if first argument is 'build' or 'dev'
  if (args[0] === "build") {
    mode = "build";
    args.shift(); // Remove the subcommand
  } else if (args[0] === "dev") {
    mode = "dev";
    args.shift(); // Remove the subcommand
  }

  // Parse remaining args as options
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
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
import net from "net";
import chalk from "chalk";

async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  while (true) {
    if (await isPortAvailable(port)) return port;
    console.log(`Port ${port} is in use, trying another one...`);
    port++;
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

// Entrypoint
async function main() {
  if (mode === "dev") {
    const start = Date.now();
    await buildAll(DEV_DIR, SRC_DIR, false);
    const readyMs = Date.now() - start;
    const portArg = opts.port ? Number(opts.port) : 3000;
    const PORT = await findAvailablePort(portArg);
    watch(DEV_DIR, SRC_DIR, PORT);
    serve(DEV_DIR, PORT, readyMs);
  } else if (mode === "build") {
    console.log();
    console.log(
      chalk.cyan("flowscript") +
        chalk.rgb(21, 110, 245)(" building for production..."),
    );
    const start = Date.now();
    await buildAll(DIST_DIR, SRC_DIR, true);
    logBuildOutput(DIST_DIR, start);
  } else {
    console.error(`Unknown mode: ${mode}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
