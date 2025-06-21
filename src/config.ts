import path from "path";

export type Mode = "dev" | "build";

export interface Config {
  mode: Mode;
  srcDir: string;
  devDir: string;
  distDir: string;
  port: number;
  host?: string; // Optional host (e.g. "localhost", "0.0.0.0")
  dropConsole: boolean;
  dropDebugger: boolean;
  minify: boolean;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: Record<string, string | boolean> = {};
  let mode: Mode = "dev";

  if (args[0] === "build" || args[0] === "dev") {
    mode = args[0];
    args.shift();
  }

  for (const arg of args) {
    if (arg.startsWith("--")) {
      const [key, val] = arg.replace(/^--/, "").split("=");
      if (key === "host") {
        opts["host"] = val === undefined ? true : val;
      } else {
        opts[key] = val === undefined ? true : val;
      }
    }
  }

  return { mode, opts };
}

function loadConfig(): Config {
  const { mode, opts } = parseArgs();

  const srcDir = path.resolve(process.cwd(), (opts.src as string) || "src");
  const outDir = (opts.out as string) || (mode === "dev" ? "dev" : "dist");
  const devDir = path.resolve(process.cwd(), mode === "dev" ? outDir : "dev");
  const distDir = path.resolve(
    process.cwd(),
    mode === "build" ? outDir : "dist",
  );
  const port = opts.port ? Number(opts.port) : 6173;
  const host =
    typeof opts.host === "string"
      ? opts.host
      : opts.host
        ? "0.0.0.0"
        : "localhost";
  const dropConsole = Boolean(opts["drop-console"]);
  const dropDebugger = Boolean(opts["drop-debugger"]);
  const minify = Boolean(opts.minify);

  return {
    mode,
    srcDir,
    devDir,
    distDir,
    port,
    host,
    dropConsole,
    dropDebugger,
    minify,
  };
}

export const config = loadConfig();
