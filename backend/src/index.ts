import { serve, FileSystemRouter, type Server } from "bun";
import * as path from "node:path";
import logger from "./lib/logger.ts";
import EventEmitter from "node:events";
import { z } from "zod";
import type { SSESchema } from "../../shared/schemas";

export const emitter = new EventEmitter<{
  sse: [data: z.infer<typeof SSESchema>];
}>();

setInterval(() => {
  emitter.emit("sse", { kind: "keep-alive" });
}, 20000);

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
    
    async function get(this: Server) {
      const match = router.match(url.pathname);
      
      if(!match) return Response.json({ success: false, error: "Not Found" }, { status: 404 });
      
      try {
        const appRequest = Object.assign(req, { route: match });
        const module = await import(match.filePath);
        const preMethod = module.pre;
        if(preMethod && typeof preMethod === "function") {
          const result = await preMethod.call(this, appRequest);
          if(result instanceof Response) return result;
        }
        const method = module[req.method];
        if(method && typeof method === "function") {
          const result = await method.call(this, appRequest);
          if(result instanceof Response) return result;
        }
      } catch(e) {
        logger.error(e);
        return Response.json({ success: false, error: "Internal Server Error" }, { status: 500 });
      }
      
      return Response.json({ success: false, error: "Not Found" }, { status: 404 });
    }
    
    const res = await get.call(this);
    const ip = this.requestIP(req);
    logger.info(ip?.address ?? "", req.method, url.pathname, res?.status ?? 200);
    return res;
  },
  idleTimeout: 32,
});

logger.info(`Server running at http://localhost:${server.port}`);