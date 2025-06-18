import { buildAll } from "../build.js";
import { watch } from "../watch.js";
import { serve } from "../server.js";
import { findAvailablePort } from "../utils/network.js";
import { Config } from "../config.js";

export async function runDev(config: Config) {
  const start = Date.now();
  await buildAll(
    config.devDir,
    config.srcDir,
    false,
    config.dropConsole,
    config.dropDebugger,
  );
  const readyMs = Date.now() - start;
  const port = await findAvailablePort(config.port);
  watch(
    config.devDir,
    config.srcDir,
    port,
    config.dropConsole,
    config.dropDebugger,
  );
  serve(config.devDir, port, readyMs);
}
