import type { AppRequest } from "../lib/types.ts";
import { ModelSchema, routes } from "../../../shared/schemas.ts";
import { z } from "zod";
import type { Model } from "../../../shared";
import { isValidJSON } from "../lib/utils.ts";
import logger from "../lib/logger.ts";
import { ConversationService } from "../lib/database";
import { availableModels } from "../core/constants.ts";

export async function POST(req: AppRequest): Promise<Response> {
  let model: Model = availableModels[0];
  const data = await req.text();
  logger.trace("/create", { data });
  if(isValidJSON(data)) {
    const result = z.object({
      model: ModelSchema,
    }).safeParse(JSON.parse(data));
    if(result.success) {
      model = result.data.model;
    }
  }
  // const result = await db.chat.create({ data: { model } });
  const c = await ConversationService.create({ model, name: null, messages: [], archived: false });
  return Response.json(
    routes["create"].parse(
      {
        ...c,
        updated_at: c.updated_at.toISOString()
      } satisfies z.infer<typeof routes["create"]>
    )
  );
}