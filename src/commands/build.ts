import chalk from "chalk";
import { logBuildOutput } from "../output.js";
import { Config } from "../config.js";
import fs from "fs";
import path from "path";
import esbuild, { type Metafile } from "esbuild";
import { getEntryPoints } from "../utils/build.js";

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
  srcDir: string,
  prod: boolean = false,
  dropConsole: boolean = false,
  dropDebugger: boolean = false,
  minify: boolean = false,
): Promise<Metafile | undefined> {
  const relPath = path.relative(srcDir, entry);
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
    minify: minify,
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
  srcDir: string,
  prod: boolean = false,
  dropConsole: boolean = false,
  dropDebugger: boolean = false,
  minify: boolean = false,
) {
  removeDir(outDir);
  ensureDir(outDir);
  const entries = getEntryPoints(srcDir);
  await Promise.all(
    entries.map((e) =>
      buildEntry(e, outDir, srcDir, prod, dropConsole, dropDebugger, minify),
    ),
  );
}
