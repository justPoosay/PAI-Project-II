import type { AppRequest } from "../../lib/types.ts";
import { db } from "../../lib/db.ts";

export async function POST(req: AppRequest): Promise<Response> {
  const { id } = req.route.params;
  const result = await db.chat.findFirst({ where: { id, active: true } });
  if (!result) return new Response(null, { status: 404 });
  await db.chat.update({ where: { id }, data: { active: false } });
  return new Response(null, { status: 204 });
}