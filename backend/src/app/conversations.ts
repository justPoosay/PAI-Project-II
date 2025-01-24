import type { AppRequest } from "../lib/types";
import { routes } from "../../../shared/schemas.ts";
import { ConversationService } from "../lib/database";

export async function GET(req: AppRequest): Promise<Response> {
  const cs = await ConversationService.find({ archived: false });
  return Response.json(
    routes["conversations"].parse(
      cs
      .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
      .map(({ updated_at, ...c }) => ({ ...c, updated_at: updated_at.toISOString() })),
    ),
  );
}