import type { AppRequest } from "../../../lib/types";
import { db } from "../../../lib/db";

export async function GET(req: AppRequest): Promise<Response> {
  return Response.json({ success: true, data: await db.message.findMany({ where: { chatId: req.route.params.id } }) });
}