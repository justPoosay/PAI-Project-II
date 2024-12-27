import { db } from "../lib/db";
import type { AppRequest } from "../lib/types";
import { routes } from "../../../shared/schemas.ts";

export async function GET(req: AppRequest): Promise<Response> {
  const result = await db.chat.findMany({ where: { active: true } });
  return Response.json(
    routes["conversations"].parse(
      result
      .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
      .map(conversation => ({ ...conversation, updated_at: conversation.updated_at.toISOString() }))
    )
  );
}