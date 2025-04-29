import express from "express";
import chalk from "chalk";

export function serve(outDir: string, PORT: number, readyMs?: number) {
  const app = express();
  app.use(express.static(outDir));
  const start = Date.now();
  app.listen(PORT, () => {
    const elapsed = readyMs ?? Date.now() - start;
    console.log();
    console.log(
      chalk.rgb(21, 110, 245).bold("  FlowScript") +
        chalk.dim("  ready in ") +
        chalk.white.bold(elapsed) +
        chalk.white(" ms")
    );
    console.log();
    console.log(
      chalk.cyan("  ➜") +
        chalk.white.bold(`  Local:`) +
        chalk.cyan(` http://localhost:${PORT}/`)
    );
    console.log();
  });
}
