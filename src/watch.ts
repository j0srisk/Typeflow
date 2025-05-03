import chokidar from "chokidar";
import path from "path";
import fs from "fs";
import { buildEntry, removeDir, ensureDir, getEntryPoints } from "./build.js";
import { logDevAction } from "./output.js";
import { DependencyGraph } from "./dependency-graph.js";

export async function watch(
  outDir: string,
  SRC_DIR: string,
  PORT: number,
  dropConsole: boolean = false,
  dropDebugger: boolean = false,
) {
  // Clear dev folder on startup
  removeDir(outDir);
  ensureDir(outDir);

  // Initialize dependency graph
  const depGraph = new DependencyGraph();

  // Build all entries initially and populate the dependency graph
  const entries = getEntryPoints(SRC_DIR).filter(
    (e) => e.endsWith(".ts") || e.endsWith(".js"),
  );
  await Promise.all(
    entries.map(async (entry) => {
      const metafile = await buildEntry(
        entry,
        outDir,
        SRC_DIR,
        false,
        dropConsole,
        dropDebugger,
      );
      if (metafile) depGraph.updateFromMetafile(entry, metafile);
    }),
  );

  const watcher = chokidar.watch(
    [`${SRC_DIR}/**/*.ts`, `${SRC_DIR}/**/*.js`, `${SRC_DIR}/**/*.css`],
    {
      ignored: "**/*.d.ts",
    },
  );

  // On file change, rebuild all entry points that depend on the changed file
  watcher.on("change", async (file) => {
    if (file.endsWith(".ts") || file.endsWith(".js")) {
      const dependents = depGraph.getDependents(file);
      if (dependents.size === 0) {
        // Fallback: if not tracked, just rebuild the file directly
        const metafile = await buildEntry(
          file,
          outDir,
          SRC_DIR,
          false,
          dropConsole,
          dropDebugger,
        );
        if (metafile) depGraph.updateFromMetafile(file, metafile);
        logDevAction({
          action: "recompiled",
          file,
          srcDir: SRC_DIR,
          port: PORT,
        });
        return;
      }
      await Promise.all(
        Array.from(dependents).map(async (entry) => {
          depGraph.removeEntry(entry);
          const metafile = await buildEntry(
            entry,
            outDir,
            SRC_DIR,
            false,
            dropConsole,
            dropDebugger,
          );
          if (metafile) depGraph.updateFromMetafile(entry, metafile);
          logDevAction({
            action: "recompiled",
            file: entry,
            srcDir: SRC_DIR,
            port: PORT,
          });
        }),
      );
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

  // On file add, treat as a potential new entry or dependency
  watcher.on("add", async (file) => {
    if (file.endsWith(".ts") || file.endsWith(".js")) {
      // Rebuild all entries (conservative, but safe for new deps)
      await Promise.all(
        entries.map(async (entry) => {
          depGraph.removeEntry(entry);
          const metafile = await buildEntry(
            entry,
            outDir,
            SRC_DIR,
            false,
            dropConsole,
            dropDebugger,
          );
          if (metafile) depGraph.updateFromMetafile(entry, metafile);
          logDevAction({
            action: "compiled",
            file: entry,
            srcDir: SRC_DIR,
            port: PORT,
          });
        }),
      );
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

  // On file removal, clean up outputs and dependency graph
  watcher.on("unlink", async (file) => {
    if (file.endsWith(".ts") || file.endsWith(".js")) {
      const base = path.basename(file, path.extname(file));
      const jsOut = path.join(outDir, `${base}.js`);
      if (fs.existsSync(jsOut)) fs.unlinkSync(jsOut);
      depGraph.removeEntry(file);
      // logDevAction({ action: "removed", file, srcDir: SRC_DIR, port: PORT });
    } else if (file.endsWith(".css")) {
      const relPath = path.relative(SRC_DIR, file);
      const cssOut = path.join(outDir, relPath);
      if (fs.existsSync(cssOut)) fs.unlinkSync(cssOut);
      // logDevAction({ action: "removed", file, srcDir: SRC_DIR, port: PORT });
    }
  });
}
