import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const root = path.resolve(__dirname, "..");
const packageJson = require("../package.json");

function packedFiles(): string[] {
  const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, npm_config_ignore_scripts: "true" },
  });
  return JSON.parse(output)[0].files.map((f: { path: string }) => f.path);
}

describe("package", () => {
  const bins: Record<string, string> =
    typeof packageJson.bin === "string"
      ? { [packageJson.name]: packageJson.bin }
      : packageJson.bin;

  it.each(Object.entries(bins))(
    "bin %s points to an existing executable script",
    (_name, binPath) => {
      const file = path.join(root, binPath);
      expect(fs.existsSync(file)).toBe(true);
      expect(
        fs.readFileSync(file, "utf8").startsWith("#!/usr/bin/env node"),
      ).toBe(true);
    },
  );

  it("includes every bin script in the published package", () => {
    const files = packedFiles();
    for (const binPath of Object.values(bins)) {
      expect(files).toContain(path.posix.normalize(binPath));
    }
  });
});
