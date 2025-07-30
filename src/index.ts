#!/usr/bin/env node
import { Command } from "commander";
import { devCommand } from "./commands/dev";
import { buildCommand } from "./commands/build";

const program = new Command();
const packageJson = require("../package.json");

program
  .name("typeflow")
  .description(
    "Local development server for TypeScript/JavaScript and CSS files in Webflow projects",
  )
  .version(packageJson.version, "-v, --version", "output the version number");

program
  .description("Start development server")
  .option("-p, --port <port>", "Port to run on", "3000")
  .option("-r, --reload", "Enable live reload")
  .option("-d, --debug", "Enable debug logging")
  .action(devCommand);

program
  .command("dev")
  .description("Start development server")
  .option("-p, --port <port>", "Port to run on", "3000")
  .option("-r,--reload", "Enable live reload")
  .option("-d, --debug", "Enable debug logging")
  .action(devCommand);

program
  .command("build")
  .description("Build files for production")
  .option("--minify", "Minify output files")
  .option("--drop-console", "Remove console statements")
  .option("--sourcemap", "Generate source maps")
  .option("--debug", "Enable debug logging")
  .action(buildCommand);

program.parse();
