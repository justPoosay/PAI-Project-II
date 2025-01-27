import { serve, FileSystemRouter } from "bun";
import * as path from "node:path";
import type { AppRequest } from "./lib/types";
import logger from "./lib/logger.ts";

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
    
    async function get() {
      const match = router.match(url.pathname);
      
      if(!match) return Response.json({ success: false, error: "Not Found" }, { status: 404 });
      
      try {
        const module = await import(match.filePath);
        const preMethod = module.pre;
        if(preMethod && typeof preMethod === "function") {
          const result: (req: AppRequest) => Response | null = await preMethod(Object.assign(req, { route: match }));
          if(result instanceof Response) return result;
        }
        const method = module[req.method];
        if(method && typeof method === "function") {
          const result: (req: AppRequest) => Response = await method(Object.assign(req, { route: match }));
          if(result instanceof Response) return result;
        }
      } catch(e) {
        console.error(e);
        return Response.json({ success: false, error: "Internal Server Error" }, { status: 500 });
      }
      
      return Response.json({ success: false, error: "Not Found" }, { status: 404 });
    }
    
    const res = await get();
    const ip = server.requestIP(req);
    logger.info(ip?.address ?? "", req.method, url.pathname, res?.status ?? 200);
    return res;
  },
});

logger.info(`Server running at http://localhost:${server.port}`);