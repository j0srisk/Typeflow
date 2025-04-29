import chokidar from "chokidar";
import path from "path";
import fs from "fs";
import chalk from "chalk";
import { buildEntry } from "./build";

export function flowscriptLog(action: string, file: string, SRC_DIR: string, PORT: number) {
  const now = new Date();
  const timestamp = now.toLocaleTimeString("en-US", { hour12: true });
  let relPath = path.relative(SRC_DIR, file).replace(/\\/g, "/");
  let servedPath = relPath.replace(/\.ts$/, ".js");
  if (!servedPath.startsWith("/")) servedPath = "/" + servedPath;
  const link = `http://localhost:${PORT}${servedPath}`;
  console.log(
    chalk.dim(`${timestamp}`) +
      chalk.cyan.bold(` [flowscript]`) +
      chalk.dim(` script`) +
      chalk.rgb(21, 110, 245).bold(` ${action}`) +
      ` \u001b]8;;${link}\u0007${chalk.dim(relPath)}\u001b]8;;\u0007`
  );
}

export function watch(outDir: string, SRC_DIR: string, PORT: number) {
  const watcher = chokidar.watch([`${SRC_DIR}/**/*.ts`, `${SRC_DIR}/**/*.js`]);
  watcher.on("change", async (file) => {
    if (file.endsWith(".ts") || file.endsWith(".js")) {
      await buildEntry(file, outDir, SRC_DIR);
      flowscriptLog("rebuilt", file, SRC_DIR, PORT);
    }
  });
  watcher.on("add", async (file) => {
    if (file.endsWith(".ts") || file.endsWith(".js")) {
      await buildEntry(file, outDir, SRC_DIR);
      flowscriptLog("added", file, SRC_DIR, PORT);
    }
  });
  watcher.on("unlink", async (file) => {
    const base = path.basename(file, path.extname(file));
    const jsOut = path.join(outDir, `${base}.js`);
    if (fs.existsSync(jsOut)) fs.unlinkSync(jsOut);
    flowscriptLog("removed", file, SRC_DIR, PORT);
  });
}
