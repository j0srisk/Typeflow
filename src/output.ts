import chalk from "chalk";
import path from "path";
import fs from "fs";
import { gzipSizeSync } from "gzip-size";

export function logDevAction({
  action,
  file,
  srcDir,
  port,
}: {
  action: string;
  file: string;
  srcDir: string;
  port: number;
}) {
  const now = new Date();
  const timestamp = now.toLocaleTimeString("en-US", { hour12: true });
  let relPath = path.relative(srcDir, file).replace(/\\/g, "/");
  let servedPath = relPath.replace(/\.ts$/, ".js");
  if (!servedPath.startsWith("/")) servedPath = "/" + servedPath;
  const link = `http://localhost:${port}${servedPath}`;
  console.log(
    chalk.dim(`${timestamp}`) +
      chalk.cyan.bold(` [flowscript]`) +
      chalk.rgb(21, 110, 245).bold(` script ${action}`) +
      ` \u001b]8;;${link}\u0007${chalk.dim(relPath)}\u001b]8;;\u0007`,
  );
}

export function logBuildFile({
  fullPath,
  maxLen,
  size,
  gz,
}: {
  fullPath: string;
  maxLen: number;
  size: number;
  gz: number;
}) {
  const lastSlash = fullPath.lastIndexOf("/") + 1;
  const dimPart = chalk.dim(fullPath.slice(0, lastSlash));
  const cyanPart = chalk.cyan(fullPath.slice(lastSlash));
  const styledPath = dimPart + cyanPart;
  const padded = styledPath + " ".repeat(maxLen - fullPath.length + 3);
  const sizeStr = chalk.bold(`${(size / 1024).toFixed(2)} kB`);
  const gzipStr = `${(gz / 1024).toFixed(2)} kB`;
  const sizesDisplay = chalk.dim(`${sizeStr} │ gzip: ${gzipStr}`);
  console.log(padded + sizesDisplay);
}

export function logBuildOutput(dir: string, startTime: number) {
  const files: string[] = [];
  function walk(current: string) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }
  walk(dir);

  const rel = (f: string) => path.relative(dir, f).replace(/\\/g, "/");
  // Build display paths first to compute max length
  const displayPaths: string[] = files.map((file) => {
    const relPath = rel(file);
    const dirPart = path.dirname(relPath);
    const filePart = path.basename(relPath);
    // Always prefix with 'dist/'
    const fullPath =
      (dirPart !== "." ? `dist/${dirPart}/` : "dist/") + filePart;
    return fullPath;
  });
  // Find the max length (strip color codes for length calculation)
  const maxLen = displayPaths.reduce((max, p) => Math.max(max, p.length), 0);

  console.log(chalk.rgb(21, 110, 245)("✓") + ` ${files.length} files built.`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const stat = fs.statSync(file);
    const size = stat.size;
    const gz = gzipSizeSync(fs.readFileSync(file));
    const relPath = rel(file);
    const dirPart = path.dirname(relPath);
    const filePart = path.basename(relPath);
    // Always prefix with 'dist/'
    const fullPath =
      (dirPart !== "." ? `dist/${dirPart}/` : "dist/") + filePart;
    logBuildFile({ fullPath, maxLen, size, gz });
  }
  const elapsed = Date.now() - startTime;
  console.log(chalk.rgb(21, 110, 245)(`✓ built in ${elapsed}ms`));
}
