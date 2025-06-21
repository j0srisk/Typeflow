import { getEntryPoints } from "../utils/build.js";
import { Config } from "../config.js";
import * as esbuild from "esbuild";
import chalk from "chalk";
import chokidar from "chokidar";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { findAvailablePort, getLocalIP } from "../utils/network.js";

export async function runDev(config: Config) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const packageJsonPath = path.resolve(__dirname, "../../package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const version = packageJson.version;
  const SERVE_PORT = await findAvailablePort(config.port);
  const SERVE_ORIGIN = `http://localhost:${SERVE_PORT}`;

  const drop: ("console" | "debugger")[] = [];
  if (config.dropConsole) drop.push("console");
  if (config.dropDebugger) drop.push("debugger");

  let context: esbuild.BuildContext | null = null;

  async function startEsbuild(firstRun: boolean = false) {
    if (context) {
      await context.dispose();
    }

    const start = Date.now();
    const entryPoints = getEntryPoints(config.srcDir).filter(
      (e) => e.endsWith(".ts") || e.endsWith(".js") || e.endsWith(".css"),
    );

    context = await esbuild.context({
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
      host: config.host || "localhost",
    });

    const elapsed = Date.now() - start;
    if (firstRun) {
      console.log();
      console.log(
        chalk.rgb(21, 110, 245).bold(`  TYPEFLOW v${version}`) +
          chalk.dim("  ready in ") +
          chalk.white.bold(`${elapsed}`) +
          chalk.white(" ms"),
      );
      console.log();
      // Always print local
      console.log(
        chalk.rgb(21, 110, 245)("  ➜") +
          chalk.white.bold(`  Local:   `) +
          chalk.cyan(`http://localhost:${chalk.bold(String(SERVE_PORT))}/`),
      );
      // If host is not localhost, print network address
      if (config.host && config.host !== "localhost") {
        const localIP = getLocalIP();
        if (localIP) {
          console.log(
            chalk.rgb(21, 110, 245)("  ➜") +
              chalk.white.bold(`  Network: `) +
              chalk.cyan(
                `http://${localIP}:${chalk.bold(String(SERVE_PORT))}/`,
              ),
          );
        }
      } else {
        console.log(
          chalk.rgb(21, 110, 245)("  ➜") +
            chalk.dim.bold("  Network: ") +
            chalk.dim("use") +
            chalk.bold(" --host") +
            chalk.dim(" to expose"),
        );
      }
      console.log();
    }
  }

  await startEsbuild(true);

  const watcher = chokidar.watch(config.srcDir, {
    ignored: /(^|[/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
  });

  let reloadTimeout: ReturnType<typeof setTimeout>;
  let lastUnlinked: { path: string; time: number } | null = null;

  const reload = () => {
    clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(async () => {
      await startEsbuild();
    }, 100);
  };

  watcher
    .on("add", (filePath) => {
      const now = Date.now();
      const time = new Date().toLocaleTimeString();
      if (lastUnlinked && now - lastUnlinked.time < 100) {
        console.log(
          `${chalk.dim(time)} ${chalk.cyan.bold("[typeflow]")} ${chalk.blue(
            "file renamed",
          )} ${chalk.dim(path.relative(process.cwd(), filePath))}`,
        );
        lastUnlinked = null;
      } else {
        console.log(
          `${chalk.dim(time)} ${chalk.cyan.bold("[typeflow]")} ${chalk.green(
            "file added",
          )} ${chalk.dim(path.relative(process.cwd(), filePath))}`,
        );
      }
      reload();
    })
    .on("unlink", (filePath) => {
      lastUnlinked = { path: filePath, time: Date.now() };
      setTimeout(() => {
        if (lastUnlinked && lastUnlinked.path === filePath) {
          const time = new Date().toLocaleTimeString();
          console.log(
            `${chalk.dim(time)} ${chalk.cyan.bold("[typeflow]")} ${chalk.red(
              "file removed",
            )} ${chalk.dim(path.relative(process.cwd(), filePath))}`,
          );
          lastUnlinked = null;
        }
      }, 100);
      reload();
    });
}
