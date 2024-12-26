import type { AppRequest } from "../lib/types.ts";
import { db } from "../lib/db.ts";
import { routes } from "../../../shared/schemas.ts";

export async function GET(req: AppRequest): Promise<Response> {
  const result = await db.chat.create({ data: {} });
  return Response.json(routes["create"].parse(result));
}