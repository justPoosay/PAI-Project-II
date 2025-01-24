import type { AppRequest } from "../../lib/types.ts";
import { routes } from "../../../../shared/schemas.ts";
import { ConversationService } from "../../lib/database";

export async function GET(req: AppRequest): Promise<Response> {
  const { id } = req.route.params;
  const c = await ConversationService.findOne(id, { archived: false });
  return Response.json(
    routes["[id]"]["messages"].parse(c?.messages ?? []),
  );
}