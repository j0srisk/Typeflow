import * as esbuild from "esbuild";
import * as path from "path";
import * as fs from "fs";
import { WebSocketServer } from "ws";
import { logger } from "../utils/logger";
import { cleanDirectory, ensureDirectory } from "../utils/fs-utils";

interface DevOptions {
  port: string;
  reload: boolean;
  debug: boolean;
}

export async function devCommand(options: DevOptions) {
  const startTime = Date.now();
  const port = parseInt(options.port);
  const srcDir = path.resolve(process.cwd(), "src");
  const distDir = path.resolve(process.cwd(), "dist");

  // Set debug level
  logger.setDebug(options.debug);

  // Check if src directory exists
  if (!fs.existsSync(srcDir)) {
    logger.error(
      "src directory not found. Please create a src folder with your TypeScript/CSS files.",
    );
    process.exit(1);
  }

  logger.debug("Starting development server...");

  // Clean dist directory on startup
  cleanDirectory(distDir);
  ensureDirectory(distDir);

  // WebSocket server for live reload
  let wsServer: WebSocketServer | null = null;
  if (options.reload) {
    wsServer = new WebSocketServer({ port: port + 1 });
    wsServer.on("connection", (ws) => {
      logger.debug("Client connected to live reload");
    });
  }

  function notifyClients() {
    if (wsServer) {
      wsServer.clients.forEach((client) => {
        if (client.readyState === 1) {
          // WebSocket.OPEN
          client.send("reload");
        }
      });
    }
  }

  // Create esbuild context with actual file paths - esbuild watch will detect changes to these files
  const ctx = await esbuild.context({
    entryPoints: [
      `${srcDir}/**/*.ts`,
      `${srcDir}/**/*.js`,
      `${srcDir}/**/*.css`,
    ],
    logLevel: options.debug ? "info" : "error", // Show warnings in debug mode
    bundle: true,
    outdir: distDir,
    outbase: srcDir,
    format: "iife",
    target: "es2020",
    loader: {
      ".ts": "ts",
      ".js": "js",
      ".css": "css",
    },
    sourcemap: true,
    write: true,
    plugins: options.reload
      ? [
          {
            name: "live-reload-inject",
            setup(build) {
              build.onLoad({ filter: /\.(ts|js)$/ }, async (args) => {
                const contents = await fs.promises.readFile(args.path, "utf8");

                // Read live-reload client code
                const liveReloadPath = path.resolve(
                  __dirname,
                  "../../src/client/live-reload.ts",
                );
                let liveReloadCode = await fs.promises.readFile(
                  liveReloadPath,
                  "utf8",
                );
                // Replace placeholder with actual port
                liveReloadCode = liveReloadCode.replace(
                  "{{PORT}}",
                  (port + 1).toString(),
                );

                const injectedCode = `${liveReloadCode}\n${contents}`;
                return {
                  contents: injectedCode,
                  loader: "ts",
                };
              });
            },
          },
          {
            name: "watch-plugin",
            setup(build) {
              build.onEnd((result) => {
                if (result.errors.length === 0) {
                  logger.debug("Build completed successfully");
                  notifyClients();
                } else {
                  logger.error(
                    `Build failed with ${result.errors.length} errors`,
                  );
                  result.errors.forEach((error) => {
                    console.error(error.text);
                  });
                }
              });
            },
          },
        ]
      : [],
  });

  // Start watch mode - esbuild will automatically watch for file changes, additions, deletions
  await ctx.watch();

  // Start the development server
  const serveResult = await ctx.serve({
    servedir: distDir,
    port: port,
    host: "localhost",
  });

  const servePort = serveResult.port;
  const duration = Date.now() - startTime;

  logger.logServerStart(servePort, duration);

  // Handle cleanup on exit
  process.on("SIGINT", async () => {
    logger.debug("Shutting down...");
    await ctx.dispose();
    if (wsServer) {
      wsServer.close();
    }
    process.exit(0);
  });
}
