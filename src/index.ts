#!/usr/bin/env node
import { Command } from 'commander';
import { devCommand } from './commands/dev';
import { buildCommand } from './commands/build';

const program = new Command();

program
  .name('typeflow')
  .description('Local development server for TypeScript/JavaScript and CSS files in Webflow projects')
  .version('1.0.0');

program
  .command('dev')
  .description('Start development server with live reload')
  .option('-p, --port <port>', 'Port to run on', '3000')
  .option('--no-reload', 'Disable live reload')
  .action(devCommand);

program
  .command('build')
  .description('Build files for production')
  .option('--minify', 'Minify output files')
  .option('--drop-console', 'Remove console statements')
  .option('--sourcemap', 'Generate source maps')
  .action(buildCommand);

program.parse();