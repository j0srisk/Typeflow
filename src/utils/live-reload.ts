import { WebSocketServer } from "ws";
import { findAvailablePort } from "./network.js";

const LIVE_RELOAD_PORT_START = 24678;

export async function startLiveReloadServer() {
  const port = await findAvailablePort(LIVE_RELOAD_PORT_START);
  const wss = new WebSocketServer({ port });

  wss.on("connection", (ws) => {
    ws.on("error", console.error);
  });

  const broadcastReload = () => {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.send("reload");
      }
    });
  };

  const script = `new WebSocket('ws://' + location.hostname + ':${port}').onmessage = () => location.reload();`;

  return { broadcastReload, script };
}
