import type { AppRequest } from "../lib/types.ts";
import { db } from "../lib/db.ts";
import { routes } from "../../../shared/schemas.ts";
import { z } from "zod";

export async function POST(req: AppRequest): Promise<Response> {
  const result = await db.chat.create({ data: {} });
  return Response.json(
    routes["create"].parse(
      { ...result, updated_at: result.updated_at.toISOString() } satisfies z.infer<typeof routes["create"]>
    )
  );
}