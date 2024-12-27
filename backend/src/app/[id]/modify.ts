import type { AppRequest } from "../../lib/types.ts";
import { db } from "../../lib/db.ts";
import { z } from "zod";
import { isValidJSON } from "../../lib/utils.ts";

export async function pre(req: AppRequest): Promise<Response | null> {
  const result = await db.chat.findFirst({ where: { id: req.route.params.id, active: true } });
  if(!result) return new Response(null, { status: 404 });
  return null;
}

export async function DELETE(req: AppRequest): Promise<Response> {
  const { id } = req.route.params;
  await db.chat.update({ where: { id }, data: { active: false } });
  return new Response(null, { status: 204 });
}

export async function PATCH(req: AppRequest): Promise<Response> {
  const { id } = req.route.params;
  const userSuppliedData = await req.text();
  if(!isValidJSON(userSuppliedData)) return new Response(null, { status: 400 });
  const result = z.object({ name: z.string() }).safeParse(JSON.parse(userSuppliedData));
  if(!result.success) return new Response(null, { status: 400 });
  await db.chat.update({ where: { id }, data: { ...result.data } });
  return new Response(null, { status: 204 });
}