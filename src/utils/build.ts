import path from "path";
import fs from "fs";

export function getEntryPoints(srcDir: string): string[] {
  function walk(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walk(fullPath);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".js") ||
          (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) ||
          entry.name.endsWith(".css"))
      ) {
        return [fullPath];
      } else {
        return [];
      }
    });
  }
  return walk(srcDir);
}
