import { Command } from "commander";
import { devCommand } from "./commands/dev";
import { buildCommand } from "./commands/build";

const packageJson = require("../package.json");

interface CliActions {
  dev: (options: any) => void | Promise<void>;
  build: (options: any) => void | Promise<void>;
}

export function createProgram(
  actions: CliActions = { dev: devCommand, build: buildCommand },
): Command {
  const program = new Command();

  program
    .name("typeflow")
    .description(
      "Local development server for TypeScript/JavaScript and CSS files in Webflow projects",
    )
    .version(packageJson.version, "-v, --version", "output the version number")
    // Options after a subcommand belong to that subcommand. Without this, the
    // root program (which defines the same options) would claim `--port` etc.
    // from `typeflow dev --port 3002`, leaving `dev` with its defaults.
    .enablePositionalOptions();

  // Bare `typeflow` is an alias of `typeflow dev`.
  program
    .option("-p, --port <port>", "Port to run on", "3000")
    .option("-r, --reload", "Enable live reload")
    .option("-d, --debug", "Enable debug logging")
    .action((options) => actions.dev(options));

  program
    .command("dev")
    .description("Start development server")
    .option("-p, --port <port>", "Port to run on", "3000")
    .option("-r, --reload", "Enable live reload")
    .option("-d, --debug", "Enable debug logging")
    .action((options) => actions.dev(options));

  program
    .command("build")
    .description("Build files for production")
    .option("--minify", "Minify output files")
    .option("--drop-console", "Remove console statements")
    .option("--drop-debugger", "Remove debugger statements")
    .option("--sourcemap", "Generate source maps")
    .option("--debug", "Enable debug logging")
    .action((options) => actions.build(options));

  return program;
}
