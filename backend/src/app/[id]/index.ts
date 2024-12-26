import type { AppRequest, WSData } from "../../lib/types.ts";
import { server } from "../../index.ts";
import { db } from "../../lib/db.ts";

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
  if(success) console.log("Upgraded to WebSocket");
  else console.log("Failed to upgrade to WebSocket");
  return success
    ? undefined
    : new Response(null, { status: 500 });
}