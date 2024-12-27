import type { AppRequest, WSData } from "../../lib/types.ts";
import { server } from "../../index.ts";
import { db } from "../../lib/db.ts";
import logger from "../../lib/logger.ts";

export async function GET(req: AppRequest): Promise<Response | undefined> {
  const { id } = req.route.params;
  const result = await db.chat.findFirst({ where: { id, active: true } });
  if(!result) return new Response(null, { status: 404 });
  const success = server.upgrade<WSData>(req, {
    data: {
      type: "chat",
      id,
    }
  });
  if(success) logger.debug("Upgraded to WebSocket");
  else logger.warn("Failed to upgrade to WebSocket");
  return success
    ? undefined
    : new Response(null, { status: 500 });
}