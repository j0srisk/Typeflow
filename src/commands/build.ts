import * as esbuild from "esbuild";
import * as path from "path";
import * as fs from "fs";
import * as zlib from "zlib";
import { logger } from "../utils/logger";
import { cleanDirectory, ensureDirectory } from "../utils/fs-utils";

interface BuildOptions {
  minify?: boolean;
  dropConsole?: boolean;
  dropDebugger?: boolean;
  sourcemap?: boolean;
  debug?: boolean;
}

export async function buildCommand(options: BuildOptions) {
  const startTime = Date.now();
  const cwd = process.cwd();
  const srcDir = path.resolve(cwd, "src");
  const outDir = path.resolve(cwd, "dist");

  // Check if src directory exists
  if (!fs.existsSync(srcDir)) {
    logger.error(
      "src directory not found. Please create a src folder with your TypeScript/CSS files.",
    );
    process.exit(1);
  }

  const packageJson = require("../../package.json");
  logger.buildStart(packageJson.version);

  // Clean output directory
  cleanDirectory(outDir);
  ensureDirectory(outDir);

  try {
    const result = await esbuild.build({
      // Metafile paths are relative to this; pin it so they resolve correctly.
      absWorkingDir: cwd,
      entryPoints: [
        `${srcDir}/**/*.ts`,
        `${srcDir}/**/*.js`,
        `${srcDir}/**/*.css`,
      ],
      logLevel: options.debug ? "info" : "error", // Show warnings in debug mode
      bundle: true,
      outdir: outDir,
      outbase: srcDir,
      format: "iife",
      target: "es2020",
      loader: {
        ".ts": "ts",
        ".js": "js",
        ".css": "css",
      },
      minify: options.minify || false,
      drop: [
        ...(options.dropConsole ? ["console"] : []),
        ...(options.dropDebugger ? ["debugger"] : []),
      ] as ("console" | "debugger")[],
      sourcemap: options.sourcemap || false,
      write: true,
      metafile: true,
      treeShaking: true,
    });

    const duration = Date.now() - startTime;

    // Calculate file sizes with gzip
    const files: Array<{ name: string; size: string; gzip: string }> = [];

    if (result.metafile) {
      for (const [outputPath, output] of Object.entries(
        result.metafile.outputs,
      )) {
        if (!outputPath.endsWith(".map")) {
          const absolutePath = path.resolve(cwd, outputPath);
          const relativePath = path.relative(cwd, absolutePath);
          const sizeKB = (output.bytes / 1024).toFixed(2);

          // Calculate gzip size
          const fileContent = fs.readFileSync(absolutePath);
          const gzipSize = zlib.gzipSync(fileContent).length;
          const gzipKB = (gzipSize / 1024).toFixed(2);

          files.push({
            name: relativePath,
            size: `${sizeKB} kB`,
            gzip: `${gzipKB} kB`,
          });
        }
      }
    }

    logger.logBuild(files, duration);
  } catch (error) {
    logger.error(`Build failed:`);

    if (error instanceof Error) {
      // Format esbuild errors nicely
      const errorText = error.message;
      console.error(errorText);
    } else {
      console.error(error);
    }

    process.exit(1);
  }
}
