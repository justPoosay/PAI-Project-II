import type { AppRequest, WSData } from "../../lib/types.ts";
import { server } from "../../index.ts";

export async function GET(req: AppRequest): Promise<Response | undefined> {
  const success = server.upgrade<WSData>(req, {
    data: {
      type: "chat",
      id: req.route.params.id,
    }
  });
  if(success) console.log("Upgraded to WebSocket");
  else console.log("Failed to upgrade to WebSocket");
  return success ? undefined : Response.json({
    success: false,
    error: "Upgrade failed",
  }, { status: 500 });
}