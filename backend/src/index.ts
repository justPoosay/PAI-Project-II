import { serve, FileSystemRouter, type ServerWebSocket } from "bun";
import * as path from "node:path";
import type { AppRequest, WSData } from "./lib/types";
import type { ServerBoundWebSocketMessage } from "../../shared";
import { isValidJSON } from "./lib/utils.ts";
import Conversation from "./core/Conversation.ts";

const router = new FileSystemRouter({
  style: "nextjs",
  dir: path.join(__dirname, "app"),
});

export const server = serve({
  port: parseInt(process.env.PORT || "3000"),
  static: {
    "/alive": new Response("OK"),
  },
  async fetch(req, server) {
    const url = new URL(req.url);
    const match = router.match(url.pathname);
    
    console.log(req.method, url.pathname);
    
    {
      const match = url.pathname.match(/^\/chat\/([a-z0-9-]+)$/);
      if(match) {
        const success = server.upgrade<WSData>(req, {
          data: {
            type: "chat",
            id: match[1],
          }
        });
        if(success) console.log("Upgraded to WebSocket");
        else console.log("Failed to upgrade to WebSocket");
        return success ? undefined : Response.json({
          success: false,
          error: "Upgrade failed",
        }, { status: 500 });
      }
    }
    
    if(!match) return Response.json({ success: false, error: "Not Found" }, { status: 404 });
    
    const module = await import(match.filePath);
    const method = module[req.method];
    if(method && typeof method === "function") {
      const result = await method(Object.assign(req, { route: match }));
      if(result instanceof Response) return result;
    }
    
    return Response.json({ success: false, error: "Not Found" }, { status: 404 });
  },
  websocket: {
    async open(ws: ServerWebSocket<WSData>) {
      if(ws.data.type === "chat") {
        if(!ws.data.id) return ws.close(4000, "No chat ID provided");
        if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(ws.data.id))
          return ws.close(400, "Invalid chat ID");
        ws.data.instance = Conversation(ws);
      }
    },
    async close(ws: ServerWebSocket<WSData>) {
      await ws.data.instance?.close();
    },
    async message(ws: ServerWebSocket<WSData>, message) {
      if(typeof message !== "string" || !isValidJSON(message)) return;
      const msg = JSON.parse(message) as ServerBoundWebSocketMessage;
      await ws.data.instance?.onMessage(msg);
    },
  },
});

console.log(`Server running at http://localhost:${server.port}`);