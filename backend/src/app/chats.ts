import { db } from "../lib/db";
import type { AppRequest } from "../lib/types";

export async function GET(req: AppRequest): Promise<Response> {
  return Response.json({ success: true, data: await db.chat.findMany() });
}