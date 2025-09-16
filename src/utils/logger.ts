import colors from "picocolors";
import ms from "ms";

export interface LogOptions {
  timestamp?: boolean;
  clear?: boolean;
}

class Logger {
  private startTime = Date.now();
  private debugEnabled = false;

  private formatMessage(
    level: string,
    message: string,
    options: LogOptions = {},
  ): string {
    const parts: string[] = [];

    if (options.timestamp) {
      const time = new Date().toLocaleTimeString();
      parts.push(colors.dim(`[${time}]`));
    }

    parts.push(colors.bold(colors.cyan("typeflow")));
    parts.push(message);

    return parts.join(" ");
  }

  info(message: string, options: LogOptions = {}) {
    if (options.clear) process.stdout.write("\x1Bc");
    console.log(this.formatMessage("info", colors.cyan(message), options));
  }

  success(message: string, options: LogOptions = {}) {
    if (options.clear) process.stdout.write("\x1Bc");
    console.log(this.formatMessage("success", colors.green(message), options));
  }

  warn(message: string, options: LogOptions = {}) {
    if (options.clear) process.stdout.write("\x1Bc");
    console.log(this.formatMessage("warn", colors.yellow(message), options));
  }

  error(message: string, options: LogOptions = {}) {
    if (options.clear) process.stdout.write("\x1Bc");
    console.error(this.formatMessage("error", colors.red(message), options));
  }

  debug(message: string, options: LogOptions = {}) {
    if (!this.debugEnabled) return;
    if (options.clear) process.stdout.write("\x1Bc");
    console.log(this.formatMessage("debug", colors.dim(message), options));
  }

  setDebug(enabled: boolean) {
    this.debugEnabled = enabled;
  }

  logServerStart(port: string | number, duration: number) {
    const packageJson = require("../../package.json");
    console.log();
    console.log(
      `  ${colors.bold(colors.blue("TYPEFLOW"))} ${colors.blue(`v${packageJson.version}`)}  ${colors.dim("ready in")} ${colors.bold(`${duration}`)} ms`,
    );
    console.log();
    console.log(
      `  ${colors.blue("➜")}  ${colors.bold("Local:")}   ${colors.cyan(`http://localhost:${port}/`)}`,
    );
    // console.log(`  ${colors.green('➜')}  ${colors.bold('Network:')} ${colors.dim('use --host to expose')}`);
    console.log();
  }

  logFileChange(file: string, duration?: number) {
    const durationStr = duration ? colors.dim(` (+${duration}ms)`) : "";
    console.log(`${colors.dim(file)} changed, reloading...`);
    console.log(
      `${colors.green("page reload")} ${colors.dim(file)}${durationStr}`,
    );
  }

  buildStart(version: string) {
    console.log(
      `${colors.cyan("typeflow")} ${colors.cyan(`v${version}`)} ${colors.blue("building for production...")}`,
    );
  }

  private getFileColor(filename: string): (text: string) => string {
    const ext = filename.split(".").pop()?.toLowerCase();

    switch (ext) {
      case "html":
        return colors.green;
      case "css":
        return colors.magenta;
      case "js":
      case "ts":
        return colors.cyan;
      default:
        return colors.white;
    }
  }

  logBuild(
    files: Array<{ name: string; size: string; gzip: string }>,
    duration: number,
  ) {
    console.log(`${colors.blue("✓")} ${files.length} files transformed.`);

    // Find the longest filename for proper alignment
    const maxLength = Math.max(...files.map((f) => f.name.length));

    files.forEach((file) => {
      const lastSlashIndex = file.name.lastIndexOf("/");
      const dirPath =
        lastSlashIndex >= 0 ? file.name.substring(0, lastSlashIndex + 1) : "";
      const fileName =
        lastSlashIndex >= 0
          ? file.name.substring(lastSlashIndex + 1)
          : file.name;

      const colorFn = this.getFileColor(fileName);
      const displayName = `${colors.dim(dirPath)}${colorFn(fileName)}`;

      // Add 2 spaces after the longest filename
      const paddingLength = maxLength - file.name.length + 2;
      const padding = " ".repeat(paddingLength);

      console.log(
        `${displayName}${padding}${colors.bold(colors.dim(file.size.padEnd(8)))} ${colors.dim("│")} ${colors.dim(`gzip: ${file.gzip}`)}`,
      );
    });
    console.log(`${colors.blue("✓ built in")} ${colors.blue(`${duration}ms`)}`);
  }
}

export const logger = new Logger();
