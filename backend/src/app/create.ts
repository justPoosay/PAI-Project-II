import type { AppRequest } from "../lib/types.ts";
import { db } from "../lib/db.ts";
import { ModelSchema, routes } from "../../../shared/schemas.ts";
import { z } from "zod";
import type { Model } from "../../../shared";
import { isValidJSON } from "../lib/utils.ts";
import logger from "../lib/logger.ts";

export async function POST(req: AppRequest): Promise<Response> {
  let model: Model | undefined;
  const data = await req.text();
  logger.trace("/create", { data });
  if(isValidJSON(data)) {
    const result = z.object({
      model: ModelSchema.optional(),
    }).safeParse(JSON.parse(data));
    if(result.success) {
      model = result.data.model;
    }
  }
  const result = await db.chat.create({ data: { model } });
  return Response.json(
    routes["create"].parse(
      {
        ...result,
        updated_at: result.updated_at.toISOString()
      } satisfies Omit<z.infer<typeof routes["create"]>, "model">
    )
  );
}