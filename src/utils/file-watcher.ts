import chokidar from "chokidar";
import * as path from "path";
import * as fs from "fs";
import { logger } from "./logger";

export type FileEvent = "add" | "change" | "unlink" | "addDir" | "unlinkDir";

export interface FileWatcherOptions {
  ignored?: RegExp | string[];
  persistent?: boolean;
}

export interface FileChangeEvent {
  type: FileEvent;
  path: string;
  relativePath: string;
}

export class FileWatcher {
  private watcher: any | null = null;
  private callbacks: Map<FileEvent, Array<(event: FileChangeEvent) => void>> =
    new Map();

  constructor(
    private watchPath: string,
    private options: FileWatcherOptions = {}
  ) {
    // Initialize callback arrays for each event type
    ["add", "change", "unlink", "addDir", "unlinkDir"].forEach((event) => {
      this.callbacks.set(event as FileEvent, []);
    });
  }

  start(): void {
    if (this.watcher) {
      logger.warn("File watcher is already running");
      return;
    }

    this.watcher = chokidar.watch(this.watchPath, {
      ignored: this.options.ignored || /node_modules/,
      persistent: this.options.persistent !== false,
      ignoreInitial: true, // Don't fire events for existing files on startup
    });

    // Set up event listeners
    this.watcher.on("add", (filePath: string) =>
      this.handleEvent("add", filePath)
    );
    this.watcher.on("change", (filePath: string) =>
      this.handleEvent("change", filePath)
    );
    this.watcher.on("unlink", (filePath: string) =>
      this.handleEvent("unlink", filePath)
    );
    this.watcher.on("addDir", (dirPath: string) =>
      this.handleEvent("addDir", dirPath)
    );
    this.watcher.on("unlinkDir", (dirPath: string) =>
      this.handleEvent("unlinkDir", dirPath)
    );

    this.watcher.on("error", (error: any) => {
      logger.error(`File watcher error: ${error.message}`);
    });

    logger.debug(`File watcher started for: ${this.watchPath}`);
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      logger.debug("File watcher stopped");
    }
  }

  on(event: FileEvent, callback: (event: FileChangeEvent) => void): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.push(callback);
    }
  }

  off(event: FileEvent, callback: (event: FileChangeEvent) => void): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private handleEvent(type: FileEvent, filePath: string): void {
    const event: FileChangeEvent = {
      type,
      path: filePath,
      relativePath: path.relative(process.cwd(), filePath),
    };

    const callbacks = this.callbacks.get(type);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          logger.error(`Error in file watcher callback: ${error}`);
        }
      });
    }
  }
}

export function scanDirectory(
  dirPath: string,
  extensions: string[] = [".ts", ".js", ".css"]
): string[] {
  const files: string[] = [];

  function scan(currentPath: string) {
    try {
      const entries = fs.readdirSync(currentPath);

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules and hidden directories
          if (!entry.startsWith(".") && entry !== "node_modules") {
            scan(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(entry);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      logger.error(`Error scanning directory ${currentPath}: ${error}`);
    }
  }

  scan(dirPath);
  return files;
}
