import * as fs from "fs";
import * as path from "path";
import { buildCommand } from "../../src/commands/build";

describe("build command", () => {
  const testProjectDir = path.join(__dirname, "test-build-project");
  const srcDir = path.join(testProjectDir, "src");
  const distDir = path.join(testProjectDir, "dist");

  beforeEach(() => {
    // Create test project structure
    if (fs.existsSync(testProjectDir)) {
      fs.rmSync(testProjectDir, { recursive: true, force: true });
    }

    fs.mkdirSync(srcDir, { recursive: true });

    // Create test files
    fs.writeFileSync(
      path.join(srcDir, "index.ts"),
      'const greeting: string = "Hello, TypeFlow!"; console.log(greeting);',
    );

    fs.writeFileSync(
      path.join(srcDir, "styles.css"),
      "body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }",
    );

    // Create nested file
    const pagesDir = path.join(srcDir, "pages");
    fs.mkdirSync(pagesDir);
    fs.writeFileSync(
      path.join(pagesDir, "about.ts"),
      'export function aboutPage() { return "About page"; }',
    );
  });

  afterEach(() => {
    // Clean up test project
    if (fs.existsSync(testProjectDir)) {
      fs.rmSync(testProjectDir, { recursive: true, force: true });
    }

    // Restore original working directory
    process.chdir(__dirname);
  });

  it("should build TypeScript and CSS files successfully", async () => {
    // Change to test project directory
    process.chdir(testProjectDir);

    await buildCommand({});

    // Check that dist directory was created
    expect(fs.existsSync(distDir)).toBe(true);

    // Check that files were built
    expect(fs.existsSync(path.join(distDir, "index.js"))).toBe(true);
    expect(fs.existsSync(path.join(distDir, "styles.css"))).toBe(true);
    expect(fs.existsSync(path.join(distDir, "pages", "about.js"))).toBe(true);

    // Check that TypeScript was compiled to JavaScript
    const builtJS = fs.readFileSync(path.join(distDir, "index.js"), "utf8");
    expect(builtJS).toContain("Hello, TypeFlow!");
    expect(builtJS).toContain("console.log");
  });

  it("should handle minification option", async () => {
    process.chdir(testProjectDir);

    await buildCommand({ minify: true });

    expect(fs.existsSync(path.join(distDir, "index.js"))).toBe(true);

    // Minified code should be more compact
    const builtJS = fs.readFileSync(path.join(distDir, "index.js"), "utf8");
    expect(builtJS.length).toBeLessThan(100); // Should be quite short when minified
  });

  it("should handle drop console option", async () => {
    process.chdir(testProjectDir);

    await buildCommand({ dropConsole: true });

    expect(fs.existsSync(path.join(distDir, "index.js"))).toBe(true);

    // Console statements should be removed
    const builtJS = fs.readFileSync(path.join(distDir, "index.js"), "utf8");
    expect(builtJS).not.toContain("console.log");
  });

  it("should handle sourcemap option", async () => {
    process.chdir(testProjectDir);

    await buildCommand({ sourcemap: true });

    expect(fs.existsSync(path.join(distDir, "index.js"))).toBe(true);
    expect(fs.existsSync(path.join(distDir, "index.js.map"))).toBe(true);
  });

  it("should clean dist directory before building", async () => {
    process.chdir(testProjectDir);

    // Create dist directory with old files
    fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, "old-file.js"), "old content");

    await buildCommand({});

    // Old file should be removed
    expect(fs.existsSync(path.join(distDir, "old-file.js"))).toBe(false);

    // New files should exist
    expect(fs.existsSync(path.join(distDir, "index.js"))).toBe(true);
  });

  it("should exit with error if src directory does not exist", async () => {
    const emptyProjectDir = path.join(__dirname, "empty-project");
    fs.mkdirSync(emptyProjectDir, { recursive: true });
    process.chdir(emptyProjectDir);

    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    await expect(buildCommand({})).rejects.toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();

    // Clean up
    fs.rmSync(emptyProjectDir, { recursive: true, force: true });
  });
});
