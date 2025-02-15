import type { AppRequest } from "~/lib/types";
import { z } from "zod";
import { isValidJSON } from "~/lib/utils";
import { ConversationSchema, ModelSchema } from "/shared/schemas";
import { ConversationService } from "~/lib/database";

export async function pre(req: AppRequest): Promise<Response | null> {
  const c = await ConversationService.findOne(req.route.params.id, { archived: false });
  if (!c) return new Response(null, { status: 404 });
  return null;
}

export async function DELETE(req: AppRequest): Promise<Response> {
  await ConversationService.update(req.route.params.id, { archived: true });
  return new Response(null, { status: 204 });
}

export async function PATCH(req: AppRequest): Promise<Response> {
  const userSuppliedData = await req.text();
  if (!isValidJSON(userSuppliedData)) return new Response(null, { status: 400 });
  const result = z
    .object({
      name: z.string().nullable().optional(),
      model: ModelSchema.optional(),
    })
    .safeParse(JSON.parse(userSuppliedData));
  if (!result.success) return new Response(null, { status: 400 });
  const updated = await ConversationService.update(req.route.params.id, result.data);
  return Response.json(ConversationSchema.parse({ ...updated, updated_at: updated?.updated_at.toISOString() }));
}
