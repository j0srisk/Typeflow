import chalk from "chalk";
import { buildAll } from "../build.js";
import { logBuildOutput } from "../output.js";
import { Config } from "../config.js";

export async function runBuild(config: Config) {
  console.log();
  console.log(
    chalk.cyan("typeflow") +
      chalk.rgb(21, 110, 245)(" building for production..."),
  );
  const start = Date.now();
  await buildAll(
    config.distDir,
    config.srcDir,
    true,
    config.dropConsole,
    config.dropDebugger,
    config.minify,
  );
  logBuildOutput(config.distDir, start);
}
