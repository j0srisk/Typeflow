import * as fs from "fs";
import * as path from "path";
import { cleanDirectory, ensureDirectory } from "../../src/utils/fs-utils";

describe("fs-utils", () => {
  const testDir = path.join(__dirname, "test-temp");

  afterEach(() => {
    // Clean up test directory after each test
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("ensureDirectory", () => {
    it("should create directory if it does not exist", () => {
      expect(fs.existsSync(testDir)).toBe(false);

      ensureDirectory(testDir);

      expect(fs.existsSync(testDir)).toBe(true);
      expect(fs.statSync(testDir).isDirectory()).toBe(true);
    });

    it("should not fail if directory already exists", () => {
      fs.mkdirSync(testDir);
      expect(fs.existsSync(testDir)).toBe(true);

      expect(() => ensureDirectory(testDir)).not.toThrow();
      expect(fs.existsSync(testDir)).toBe(true);
    });

    it("should create nested directories", () => {
      const nestedDir = path.join(testDir, "nested", "deep");

      ensureDirectory(nestedDir);

      expect(fs.existsSync(nestedDir)).toBe(true);
      expect(fs.statSync(nestedDir).isDirectory()).toBe(true);
    });
  });

  describe("cleanDirectory", () => {
    it("should remove all files and subdirectories", () => {
      // Setup test directory with files and subdirs
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(path.join(testDir, "file1.txt"), "content1");
      fs.writeFileSync(path.join(testDir, "file2.js"), 'console.log("test");');

      const subDir = path.join(testDir, "subdir");
      fs.mkdirSync(subDir);
      fs.writeFileSync(path.join(subDir, "nested.ts"), "const x = 1;");

      expect(fs.readdirSync(testDir)).toHaveLength(3); // 2 files + 1 subdir

      cleanDirectory(testDir);

      expect(fs.existsSync(testDir)).toBe(true); // Directory still exists
      expect(fs.readdirSync(testDir)).toHaveLength(0); // But is empty
    });

    it("should handle non-existent directory gracefully", () => {
      expect(fs.existsSync(testDir)).toBe(false);

      expect(() => cleanDirectory(testDir)).not.toThrow();
    });

    it("should handle empty directory", () => {
      fs.mkdirSync(testDir);
      expect(fs.readdirSync(testDir)).toHaveLength(0);

      expect(() => cleanDirectory(testDir)).not.toThrow();
      expect(fs.existsSync(testDir)).toBe(true);
      expect(fs.readdirSync(testDir)).toHaveLength(0);
    });
  });
});
