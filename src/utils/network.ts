import net from "net";

export async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  while (true) {
    if (await isPortAvailable(port)) {
      return port;
    }
    console.log(`Port ${port} is in use, trying another one...`);
    port++;
  }
}

export function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}
