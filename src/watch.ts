import chokidar from "chokidar";
import path from "path";
import fs from "fs";
import { buildEntry, removeDir, ensureDir } from "./build.js";
import { logDevAction } from "./output.js";

export function watch(
  outDir: string,
  SRC_DIR: string,
  PORT: number,
  dropConsole: boolean = false,
  dropDebugger: boolean = false,
) {
  // Clear dev folder on startup
  removeDir(outDir);
  ensureDir(outDir);
  const watcher = chokidar.watch(
    [`${SRC_DIR}/**/*.ts`, `${SRC_DIR}/**/*.js`, `${SRC_DIR}/**/*.css`],
    {
      ignored: "**/*.d.ts",
    },
  );
  watcher.on("change", async (file) => {
    if (file.endsWith(".ts") || file.endsWith(".js")) {
      await buildEntry(file, outDir, SRC_DIR, false, dropConsole, dropDebugger);
      logDevAction({ action: "recompiled", file, srcDir: SRC_DIR, port: PORT });
    } else if (file.endsWith(".css")) {
      // Copy CSS file
      const relPath = path.relative(SRC_DIR, file);
      const cssOut = path.join(outDir, relPath);
      const cssOutDir = path.dirname(cssOut);
      if (!fs.existsSync(cssOutDir)) {
        fs.mkdirSync(cssOutDir, { recursive: true });
      }
      fs.copyFileSync(file, cssOut);
      logDevAction({ action: "recompiled", file, srcDir: SRC_DIR, port: PORT });
    }
  });
  watcher.on("add", async (file) => {
    if (file.endsWith(".ts") || file.endsWith(".js")) {
      await buildEntry(file, outDir, SRC_DIR, false, dropConsole, dropDebugger);
      logDevAction({ action: "compiled", file, srcDir: SRC_DIR, port: PORT });
    } else if (file.endsWith(".css")) {
      // Copy CSS file
      const relPath = path.relative(SRC_DIR, file);
      const cssOut = path.join(outDir, relPath);
      const cssOutDir = path.dirname(cssOut);
      if (!fs.existsSync(cssOutDir)) {
        fs.mkdirSync(cssOutDir, { recursive: true });
      }
      fs.copyFileSync(file, cssOut);
      logDevAction({ action: "compiled", file, srcDir: SRC_DIR, port: PORT });
    }
  });
  watcher.on("unlink", async (file) => {
    if (file.endsWith(".ts") || file.endsWith(".js")) {
      const base = path.basename(file, path.extname(file));
      const jsOut = path.join(outDir, `${base}.js`);
      if (fs.existsSync(jsOut)) fs.unlinkSync(jsOut);
      // logDevAction({ action: "removed", file, srcDir: SRC_DIR, port: PORT });
    } else if (file.endsWith(".css")) {
      const relPath = path.relative(SRC_DIR, file);
      const cssOut = path.join(outDir, relPath);
      if (fs.existsSync(cssOut)) fs.unlinkSync(cssOut);
      // logDevAction({ action: "removed", file, srcDir: SRC_DIR, port: PORT });
    }
  });
}
