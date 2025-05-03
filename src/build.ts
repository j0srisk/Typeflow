import path from "path";
import fs from "fs";
import esbuild, { type Metafile } from "esbuild";

export function getEntryPoints(SRC_DIR: string): string[] {
  function walk(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walk(fullPath);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".js") ||
          (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) ||
          entry.name.endsWith(".css"))
      ) {
        return [fullPath];
      } else {
        return [];
      }
    });
  }
  return walk(SRC_DIR);
}

export function removeDir(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Builds an entry point and returns the esbuild metafile if applicable.
 * @returns {Promise<object|undefined>} esbuild metafile for JS/TS entries; undefined for CSS
 */
export async function buildEntry(
  entry: string,
  outDir: string,
  SRC_DIR: string,
  prod: boolean = false,
  dropConsole: boolean = false,
  dropDebugger: boolean = false,
): Promise<Metafile | undefined> {
  const relPath = path.relative(SRC_DIR, entry);
  if (entry.endsWith(".css")) {
    // Copy CSS file directly
    const cssOut = path.join(outDir, relPath);
    const cssOutDir = path.dirname(cssOut);
    if (!fs.existsSync(cssOutDir)) {
      fs.mkdirSync(cssOutDir, { recursive: true });
    }
    fs.copyFileSync(entry, cssOut);
    return undefined;
  }
  const jsOut = path.join(outDir, relPath.replace(/\.(ts|js)$/, ".js"));
  const jsOutDir = path.dirname(jsOut);
  if (!fs.existsSync(jsOutDir)) {
    fs.mkdirSync(jsOutDir, { recursive: true });
  }
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    outfile: jsOut,
    format: "iife",
    minify: prod,
    sourcemap: !prod,
    metafile: true,
    logLevel: "silent",
    treeShaking: true,
    drop:
      dropConsole || dropDebugger
        ? ([
            ...(dropConsole ? ["console"] : []),
            ...(dropDebugger ? ["debugger"] : []),
          ] as import("esbuild").Drop[])
        : undefined,
  });
  // esbuild returns a "metafile" property when metafile: true
  return result.metafile;
}

export async function buildAll(
  outDir: string,
  SRC_DIR: string,
  prod: boolean = false,
  dropConsole: boolean = false,
  dropDebugger: boolean = false,
) {
  removeDir(outDir);
  ensureDir(outDir);
  const entries = getEntryPoints(SRC_DIR);
  await Promise.all(
    entries.map((e) =>
      buildEntry(e, outDir, SRC_DIR, prod, dropConsole, dropDebugger),
    ),
  );
}
