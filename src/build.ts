import path from "path";
import fs from "fs";
import esbuild from "esbuild";

export function getEntryPoints(SRC_DIR: string): string[] {
  function walk(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walk(fullPath);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".js") ||
          (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")))
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

export async function buildEntry(
  entry: string,
  outDir: string,
  SRC_DIR: string,
  prod: boolean = false,
  dropConsole: boolean = false,
  dropDebugger: boolean = false,
) {
  const relPath = path.relative(SRC_DIR, entry);
  const jsOut = path.join(outDir, relPath.replace(/\.(ts|js)$/, ".js"));
  const jsOutDir = path.dirname(jsOut);
  if (!fs.existsSync(jsOutDir)) {
    fs.mkdirSync(jsOutDir, { recursive: true });
  }
  await esbuild.build({
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
