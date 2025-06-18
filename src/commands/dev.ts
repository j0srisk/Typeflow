import { getEntryPoints } from "../utils/build.js";

import { Config } from "../config.js";

import * as esbuild from "esbuild";
import chalk from "chalk";

export async function runDev(config: Config) {
  const start = Date.now();
  const SERVE_PORT = config.port;
  const SERVE_ORIGIN = `http://localhost:${SERVE_PORT}`;

  const drop: ("console" | "debugger")[] = [];
  if (config.dropConsole) drop.push("console");
  if (config.dropDebugger) drop.push("debugger");

  const entryPoints = getEntryPoints(config.srcDir).filter(
    (e) => e.endsWith(".ts") || e.endsWith(".js") || e.endsWith(".css"),
  );

  const context = await esbuild.context({
    bundle: true,
    entryPoints,
    outdir: config.distDir,
    minify: config.minify,
    sourcemap: true,
    target: "esnext",
    drop,
    define: {
      SERVE_ORIGIN: JSON.stringify(SERVE_ORIGIN),
    },
    logLevel: "silent",
  });

  await context.watch();
  await context.serve({
    port: SERVE_PORT,
  });

  const elapsed = Date.now() - start;
  console.log();
  console.log(
    chalk.rgb(21, 110, 245).bold("  Typeflow") +
      chalk.dim("  ready in ") +
      chalk.white.bold(elapsed) +
      chalk.white(" ms"),
  );
  console.log();
  console.log(
    chalk.cyan("  ➜") +
      chalk.white.bold(`  Local:`) +
      chalk.cyan(` http://localhost:${SERVE_PORT}/`),
  );
  console.log();
}
