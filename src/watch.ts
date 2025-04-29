import chokidar from "chokidar";
import path from "path";
import fs from "fs";
import { buildEntry } from "./build";
import { logDevAction } from "./output";

export function watch(outDir: string, SRC_DIR: string, PORT: number) {
  const watcher = chokidar.watch([`${SRC_DIR}/**/*.ts`, `${SRC_DIR}/**/*.js`]);
  watcher.on("change", async (file) => {
    if (file.endsWith(".ts") || file.endsWith(".js")) {
      await buildEntry(file, outDir, SRC_DIR);
      logDevAction({ action: "recompiled", file, srcDir: SRC_DIR, port: PORT });
    }
  });
  watcher.on("add", async (file) => {
    if (file.endsWith(".ts") || file.endsWith(".js")) {
      await buildEntry(file, outDir, SRC_DIR);
      logDevAction({ action: "compiled", file, srcDir: SRC_DIR, port: PORT });
    }
  });
  watcher.on("unlink", async (file) => {
    const base = path.basename(file, path.extname(file));
    const jsOut = path.join(outDir, `${base}.js`);
    if (fs.existsSync(jsOut)) fs.unlinkSync(jsOut);
    // logDevAction({ action: "removed", file, srcDir: SRC_DIR, port: PORT });
  });
}
