import type { AppRequest, WSData } from "../../lib/types.ts";
import { server } from "../../index.ts";
import { db } from "../../lib/db.ts";

export async function GET(req: AppRequest): Promise<Response | undefined> {
  const { id } = req.route.params;
  const result = await db.chat.findUnique({ where: { id } });
  if(!result) return Response.json({ success: false, error: "Not Found" }, { status: 404 });
  const success = server.upgrade<WSData>(req, {
    data: {
      type: "chat",
      id,
    }
  });
  if(success) console.log("Upgraded to WebSocket");
  else console.log("Failed to upgrade to WebSocket");
  return success ? undefined : Response.json({
    success: false,
    error: "Upgrade failed",
  }, { status: 500 });
}