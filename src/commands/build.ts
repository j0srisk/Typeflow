import * as esbuild from "esbuild";
import * as path from "path";
import * as fs from "fs";
import { logger } from "../utils/logger";
import { cleanDirectory, ensureDirectory } from "../utils/fs-utils";

interface BuildOptions {
  minify?: boolean;
  dropConsole?: boolean;
  sourcemap?: boolean;
}

export async function buildCommand(options: BuildOptions) {
  const startTime = Date.now();
  const srcDir = path.resolve(process.cwd(), "src");
  const outDir = path.resolve(process.cwd(), "dist");

  // Check if src directory exists
  if (!fs.existsSync(srcDir)) {
    logger.error(
      "src directory not found. Please create a src folder with your TypeScript/CSS files.",
    );
    process.exit(1);
  }

  logger.info("building for production...");

  // Clean output directory
  cleanDirectory(outDir);
  ensureDirectory(outDir);

  try {
    const result = await esbuild.build({
      entryPoints: [
        `${srcDir}/**/*.ts`,
        `${srcDir}/**/*.js`,
        `${srcDir}/**/*.css`,
      ],
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
      drop: options.dropConsole ? ["console"] : [],
      sourcemap: options.sourcemap || false,
      write: true,
      metafile: true,
      treeShaking: true,
    });

    const duration = Date.now() - startTime;

    // Calculate file sizes
    const files: Array<{ name: string; size: string; gzip?: string }> = [];

    if (result.metafile) {
      for (const [outputPath, output] of Object.entries(
        result.metafile.outputs,
      )) {
        if (!outputPath.endsWith(".map")) {
          const relativePath = path.relative(process.cwd(), outputPath);
          const sizeKB = (output.bytes / 1024).toFixed(2);

          files.push({
            name: relativePath,
            size: `${sizeKB} kB`,
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
