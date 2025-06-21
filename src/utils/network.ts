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
    // Try to connect to the port
    const tester = net.createConnection({ port, timeout: 400 }, () => {
      // If we can connect, the port is in use
      tester.destroy();
      resolve(false);
    });

    tester.on("timeout", () => {
      // Connection timeout, port is available
      tester.destroy();
      resolve(true);
    });

    tester.on("error", (err: Error & { code?: string }) => {
      // If connection is refused, the port is available
      tester.destroy();
      if (err.code === "ECONNREFUSED") {
        resolve(true);
      } else {
        // For other errors, consider the port unavailable
        resolve(false);
      }
    });
  });
}
