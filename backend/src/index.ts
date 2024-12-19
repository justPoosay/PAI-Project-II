import { serve, FileSystemRouter } from "bun";
import * as path from "node:path";
import type { AppRequest } from "./lib/types";
import type { ServerBoundWebSocketMessage } from "../../shared";
import { isValidJSON } from "./lib/utils.ts";
import { db } from "./lib/db.ts";

const router = new FileSystemRouter({
  style: "nextjs",
  dir: path.join(__dirname, "app"),
});

const server = serve({
  port: parseInt(process.env.PORT || "3000"),
  async fetch ( req, server ) {
    const url = new URL(req.url);
    const match = router.match(url.pathname);
    
    console.log(req.method, url.pathname);
    
    {
      const match = url.pathname.match(/^\/chat\/([a-z0-9-]+)$/);
      if ( match ) {
        const success = server.upgrade(req, {
          data: {
            type: "chat",
            id: match[1],
          },
        });
        if ( success ) console.log("Upgraded to WebSocket");
        else console.log("Failed to upgrade to WebSocket");
        return success ? undefined : Response.json({
          success: false,
          error: "Upgrade failed",
        }, { status: 500 });
      }
    }
    
    if ( !match ) return Response.json({ success: false, error: "Not Found" }, { status: 404 });
    
    const module = await import(match.filePath);
    const method = module[req.method];
    if ( method && typeof method === "function" ) {
      const result = await method(Object.assign(req, { route: match }));
      if ( result instanceof Response ) return result;
    }
    
    return Response.json({ success: false, error: "Not Found" }, { status: 404 });
  },
  websocket: {
    async open ( ws ) {
      const data = ws.data as { type: string, id: string };
      if ( data.type === "chat" )
      {
        if (!data.id) return ws.close(4000, "No chat ID provided");
        ws.subscribe(data.id);
        const existing = await db.chat.findUnique({ where: { id: data.id } });
        if ( !existing ) await db.chat.create({ data: { id: data.id } });
      }
    },
    close ( ws, code: number, reason: string ) {
      const data = ws.data as { type: string, id: string };
      if ( data.type === "chat" )
        ws.unsubscribe(data.id);
    },
    message ( ws, message ) {
      if ( typeof message !== "string" || !isValidJSON(message) ) return;
      const msg = JSON.parse(message) as ServerBoundWebSocketMessage;
    },
  },
});

console.log(`Server running at http://localhost:${server.port}`);