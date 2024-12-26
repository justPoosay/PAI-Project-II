import { serve, FileSystemRouter, type ServerWebSocket } from "bun";
import * as path from "node:path";
import type { WSData } from "./lib/types";
import { ServerBoundWebSocketMessageSchema } from "../../shared/schemas.ts";
import Conversation from "./core/Conversation.ts";
import { isValidJSON } from "./lib/utils.ts";

const router = new FileSystemRouter({
  style: "nextjs",
  dir: path.join(__dirname, "app"),
});

export const server = serve({
  port: parseInt(process.env.PORT || "3000"),
  static: {
    "/alive": new Response("OK"),
  },
  async fetch(req) {
    const url = new URL(req.url);
    const match = router.match(url.pathname);
    
    console.log(req.method, url.pathname);
    
    if(!match) return Response.json({ success: false, error: "Not Found" }, { status: 404 });
    
    const module = await import(match.filePath);
    const method = module[req.method];
    if(method && typeof method === "function") {
      const result = await method(Object.assign(req, { route: match }));
      if(result instanceof Response || result === undefined) return result;
    }
    
    return Response.json({ success: false, error: "Not Found" }, { status: 404 });
  },
  websocket: {
    async open(ws: ServerWebSocket<WSData>) {
      console.log("WebSocket opened");
      if(ws.data.type === "chat") {
        ws.data.instance = Conversation(ws);
      }
    },
    async close(ws: ServerWebSocket<WSData>) {
      console.log("WebSocket closed");
      await ws.data.instance?.close();
    },
    async message(ws: ServerWebSocket<WSData>, message) {
      if (typeof message !== "string" || !isValidJSON(message)) return;
      const result = ServerBoundWebSocketMessageSchema.safeParse(JSON.parse(message));
      if (!result.success) return;
      await ws.data.instance?.onMessage(result.data);
    },
  },
});

console.log(`Server running at http://localhost:${server.port}`);