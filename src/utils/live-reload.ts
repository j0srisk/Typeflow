import { WebSocketServer } from "ws";
import type { Server } from "http";

export async function startLiveReloadServer(server: Server) {
  const wss = new WebSocketServer({ server });

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

  const script = `const u = new URL(document.currentScript.src); const p = u.protocol === 'https:' ? 'wss' : 'ws'; new WebSocket(p + '://' + u.host).onmessage = () => location.reload();`;

  return { broadcastReload, script };
}
