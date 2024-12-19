import { serve, FileSystemRouter } from "bun";
import * as path from "node:path";
import type { AppRequest } from "./lib/types";

const router = new FileSystemRouter({
  style: "nextjs",
  dir: path.join(__dirname, "app"),
});

const server = serve({
  port: parseInt(process.env.PORT || "3000"),
  async fetch(req, server) {
    const url = new URL(req.url);
    const match = router.match(url.pathname);
    
    {
      const match = url.pathname.match(/^\/chats\/([a-z0-9-]+)$/);
      if (match) {
        return server.upgrade(req, {
          data: {
            id: match[1],
          },
        }) ? undefined : Response.json({
          success: false,
          error: "Upgrade failed",
        }, { status: 500 });
      }
    }
    
    if (!match) return Response.json({ success: false, error: "Not Found" }, { status: 404 });
    
    if (/\.(js|ts)$/.test(match.src)) {
      const module = await import(match.filePath);
      const method = module[req.method];
      if (method && typeof method === "function") {
        const result = await method(Object.assign(req, { route: match }));
        if (result instanceof Response) return result;
      }
    }
    
    return Response.json({ success: false, error: "Not Found" }, { status: 404 });
  },
  websocket: {
    message(ws, message) {
    },
  },
});

console.log(`Server running at http://localhost:${server.port}`);