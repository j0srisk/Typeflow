import { getEntryPoints } from "../utils/build.js";
import { Config } from "../config.js";
import * as esbuild from "esbuild";
import chalk from "chalk";
import chokidar from "chokidar";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";
import httpProxy from "http-proxy";
import selfsigned from "selfsigned";
import { findAvailablePort, getLocalIPs } from "../utils/network.js";
import { startLiveReloadServer } from "../utils/live-reload.js";

export async function runDev(config: Config) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const packageJsonPath = path.resolve(__dirname, "../../package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const version = packageJson.version;
  const SERVE_PORT = await findAvailablePort(config.port, true);
  const ESBUILD_PORT = await findAvailablePort(SERVE_PORT + 1);

  let server: http.Server | https.Server;
  const protocol = config.https ? "https" : "http";

  const proxy = httpProxy.createProxyServer({
    target: {
      host: "localhost",
      port: ESBUILD_PORT,
    },
  });

  if (config.https) {
    const attrs = [{ name: "commonName", value: "localhost" }];
    const pems = selfsigned.generate(attrs, {
      days: 365,
      algorithm: "sha256",
    });
    server = https.createServer(
      { key: pems.private, cert: pems.cert },
      (req, res) => {
        proxy.web(req, res);
      },
    );
  } else {
    server = http.createServer((req, res) => {
      proxy.web(req, res);
    });
  }

  proxy.on("error", (err, req, res) => {
    console.log(chalk.red(`Proxy error: ${err.message}`));
    if (res instanceof http.ServerResponse) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(`Proxy error: ${err.message}`);
    }
  });

  const { broadcastReload, script: liveReloadScript } =
    await startLiveReloadServer(server);

  const drop: ("console" | "debugger")[] = [];
  if (config.dropConsole) drop.push("console");
  if (config.dropDebugger) drop.push("debugger");

  let context: esbuild.BuildContext | null = null;
  let isFirstBuild = true;

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
      banner: {
        js: liveReloadScript,
      },
      plugins: [
        {
          name: "typeflow-reloader",
          setup(build) {
            build.onEnd((result) => {
              if (isFirstBuild) {
                isFirstBuild = false;
                return;
              }
              if (result.errors.length > 0) {
                return;
              }
              // console.log(
              //   `${chalk.dim(
              //     new Date().toLocaleTimeString(),
              //   )} ${chalk.cyan.bold("[typeflow]")} ${chalk.green(
              //     "files changed, reloading...",
              //   )}`,
              // );
              broadcastReload();
            });
          },
        },
      ],
      logLevel: "silent",
    });

    await context.watch();
    await context.serve({
      port: ESBUILD_PORT,
      host: "localhost", // esbuild always serves on localhost
    });

    server.listen(SERVE_PORT, config.host);

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
      const localURL = `${protocol}://localhost:${chalk.bold(String(SERVE_PORT))}`;
      console.log(
        chalk.rgb(21, 110, 245)("  ➜") +
          chalk.white.bold(`  Local:   `) +
          chalk.cyan(localURL + "/"),
      );
      // If host is not localhost, print network address
      if (config.host !== "localhost") {
        const localIPs = getLocalIPs();
        for (const ip of localIPs) {
          const networkURL = `${protocol}://${ip}:${chalk.bold(
            String(SERVE_PORT),
          )}`;
          console.log(
            chalk.rgb(21, 110, 245)("  ➜") +
              chalk.white.bold(`  Network: `) +
              chalk.cyan(networkURL + "/"),
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
      isFirstBuild = true; // Reset for the new context
      await startEsbuild();
      broadcastReload();
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
