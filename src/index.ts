#!/usr/bin/env node

import { config } from "./config.js";
import { runDev } from "./commands/dev.js";
import { runBuild } from "./commands/build.js";

async function main() {
  if (config.mode === "dev") {
    await runDev(config);
  } else if (config.mode === "build") {
    await runBuild(config);
  } else {
    console.error(`Unknown mode: ${config.mode}`);
    process.exit(1);
  }
}

await main();
