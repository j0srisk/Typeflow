// @ts-ignore
if (typeof window !== "undefined") {
  const ws = new WebSocket("ws://localhost:{{PORT}}");
  // @ts-ignore
  ws.onmessage = () => window.location.reload();
}
