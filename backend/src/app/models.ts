import type { AppRequest } from "../lib/types.ts";
import { routes } from "../../../shared/schemas.ts";
import { availableModels } from "../core/constants.ts";

export async function GET(req: AppRequest): Promise<Response> {
  return Response.json(routes["models"].parse(availableModels))
}