import { db } from "../lib/db";
import type { AppRequest } from "../lib/types";
import { routes } from "../../../shared/schemas.ts";

export async function GET(req: AppRequest): Promise<Response> {
  const result = await db.chat.findMany();
  return Response.json(routes["chats.json"].parse(result));
}