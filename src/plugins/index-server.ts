import * as fs from "fs";
import * as path from "path";
import { Plugin, PluginBuild, Metafile } from "esbuild";

interface FileInfo {
  name: string;
  url: string;
}

interface FileData {
  js: FileInfo[];
  ts: FileInfo[];
  css: FileInfo[];
}

export function createIndexServerPlugin(serverUrl?: string): Plugin {
  return {
    name: "index-server",
    setup(build: PluginBuild) {
      // Generate index.html file on build end
      build.onEnd(async (result: any) => {
        let outputFiles: FileData = { js: [], ts: [], css: [] };

        if (result.metafile) {
          outputFiles = extractOutputFiles(result.metafile, serverUrl);
        }

        // Generate and write index.html to dist directory
        await generateIndexFile(outputFiles);
      });
    },
  };
}

async function generateIndexFile(outputFiles: FileData): Promise<void> {
  try {
    // Read the HTML template - try CLI dist first, then source
    let htmlPath = path.resolve(__dirname, "../client/index.html");
    if (!fs.existsSync(htmlPath)) {
      htmlPath = path.resolve(process.cwd(), "src/client/index.html");
    }

    let htmlContent = await fs.promises.readFile(htmlPath, "utf8");

    // Replace the placeholder with actual file data
    htmlContent = htmlContent.replace(
      "{{FILE_DATA}}",
      JSON.stringify(outputFiles),
    );

    // Write index.html to user's dist directory
    const distDir = path.resolve(process.cwd(), "dist");
    const indexPath = path.join(distDir, "index.html");
    await fs.promises.writeFile(indexPath, htmlContent, "utf8");

    // Copy CSS file to user's dist directory
    let cssPath = path.resolve(__dirname, "../client/index.css");
    if (!fs.existsSync(cssPath)) {
      cssPath = path.resolve(process.cwd(), "src/client/index.css");
    }

    const cssContent = await fs.promises.readFile(cssPath, "utf8");
    const distCssPath = path.join(distDir, "index.css");
    await fs.promises.writeFile(distCssPath, cssContent, "utf8");
  } catch (error) {
    console.error("Error generating index file:", error);
  }
}

function extractOutputFiles(metafile: Metafile, serverUrl?: string): FileData {
  const fileData: FileData = {
    js: [],
    ts: [],
    css: [],
  };

  // Extract output files from metafile
  for (const outputPath of Object.keys(metafile.outputs)) {
    const relativePath = path.relative("dist", outputPath);
    const ext = path.extname(outputPath).toLowerCase();

    // Skip sourcemap files
    if (ext === ".map") continue;

    const baseUrl = serverUrl || "http://localhost:3000";
    const fileInfo: FileInfo = {
      name: relativePath,
      url: `${baseUrl}/${relativePath}`,
    };

    switch (ext) {
      case ".js":
        fileData.js.push(fileInfo);
        break;
      case ".css":
        fileData.css.push(fileInfo);
        break;
    }
  }

  // Add source files info from inputs
  for (const inputPath of Object.keys(metafile.inputs)) {
    const ext = path.extname(inputPath).toLowerCase();

    if (ext === ".ts") {
      const fileInfo: FileInfo = {
        name: `${inputPath} (source)`,
        url: `#source-${inputPath}`,
      };
      fileData.ts.push(fileInfo);
    }
  }

  return fileData;
}
