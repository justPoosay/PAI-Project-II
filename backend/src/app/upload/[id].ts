import { file } from "bun";
import type { AppRequest } from "../../lib/types.ts";
import { db } from "../../lib/db.ts";
import * as path from "node:path";
import { uploadDir } from "./index.ts";

export async function GET(req: AppRequest): Promise<Response> {
  const result = await db.upload.findUnique({ where: { id: req.route.params.id } });
  if(!result) return new Response(null, { status: 404 });
  return new Response(file(path.join(uploadDir, result.hash)));
}