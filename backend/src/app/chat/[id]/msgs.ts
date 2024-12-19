import type { AppRequest } from "../../../lib/types.ts";
import { db } from "../../../lib/db.ts";

export async function GET(req: AppRequest): Promise<Response> {
  return Response.json(await db.message.findMany({ where: { chatId: req.route.params.id } }));
}