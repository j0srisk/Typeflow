// Installs the packed tarball into a throwaway project and runs the real CLI,
// so it catches files that exist in the repo but aren't shipped to npm.
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "typeflow-smoke-"));
const port = 4310;
let server;

function step(msg) {
  console.log(`smoke: ${msg}`);
}

function fail(msg) {
  throw new Error(msg);
}

async function waitFor(check, what, timeoutMs = 20000) {
  const end = Date.now() + timeoutMs;
  let last;
  while (Date.now() < end) {
    try {
      const result = await check();
      if (result) return result;
    } catch (err) {
      last = err;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  fail(`timed out waiting for ${what}${last ? `: ${last.message}` : ""}`);
}

function portOpen(p) {
  return new Promise((resolve) => {
    const socket = net.connect(p, "127.0.0.1");
    socket.once("connect", () => (socket.destroy(), resolve(true)));
    socket.once("error", () => resolve(false));
  });
}

try {
  step("packing");
  const [{ filename }] = JSON.parse(
    execFileSync("npm", ["pack", "--json", "--pack-destination", tmp], {
      cwd: root,
      encoding: "utf8",
    }),
  );

  step(`installing ${filename} into ${tmp}`);
  const project = path.join(tmp, "project");
  fs.mkdirSync(path.join(project, "src"), { recursive: true });
  fs.writeFileSync(path.join(project, "package.json"), '{"private":true}');
  fs.writeFileSync(
    path.join(project, "src", "main.ts"),
    'const message: string = "smoke"; console.log(message);',
  );
  fs.writeFileSync(path.join(project, "src", "styles.css"), "body{margin:0}");
  execFileSync(
    "npm",
    ["install", "--no-audit", "--no-fund", path.join(tmp, filename)],
    { cwd: project, stdio: "inherit" },
  );
  const bin = path.join(project, "node_modules", ".bin", "typeflow");

  step("typeflow --version");
  const version = execFileSync(bin, ["--version"], { encoding: "utf8" }).trim();
  const expected = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  ).version;
  if (version !== expected)
    fail(`--version printed ${version}, expected ${expected}`);

  step("typeflow build");
  execFileSync(bin, ["build"], { cwd: project, stdio: "inherit" });
  for (const f of ["main.js", "styles.css"]) {
    if (!fs.existsSync(path.join(project, "dist", f)))
      fail(`build did not produce dist/${f}`);
  }

  step(`typeflow dev --reload --port ${port}`);
  let output = "";
  server = spawn(bin, ["dev", "--reload", "--port", String(port)], {
    cwd: project,
  });
  server.stdout.on("data", (d) => (output += d));
  server.stderr.on("data", (d) => (output += d));

  const body = await waitFor(async () => {
    const res = await fetch(`http://localhost:${port}/main.js`);
    return res.status === 200 ? res.text() : null;
  }, `HTTP 200 from :${port}/main.js`).catch((err) => {
    fail(`${err.message}\n--- dev server output ---\n${output}`);
  });

  if (!body.includes(`ws://localhost:${port + 1}`)) {
    fail(`main.js does not connect live reload to ws://localhost:${port + 1}`);
  }
  await waitFor(
    () => portOpen(port + 1),
    `live-reload WebSocket on :${port + 1}`,
  );

  step("ok");
} finally {
  server?.kill();
  fs.rmSync(tmp, { recursive: true, force: true });
}
