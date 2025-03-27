import { type } from 'arktype';
import { Model, routes } from 'common';
import { getAvailableModels } from '../core/utils';
import { ConversationService } from '../lib/database';
import logger from '../lib/logger';
import type { AppRequest } from '../lib/types';
import { isValidJSON } from '../lib/utils';

export async function POST(req: AppRequest): Promise<Response> {
  let model = getAvailableModels()[0] ?? 'o3-mini';
  const data = await req.text();
  logger.trace('/create', { data });
  if (isValidJSON(data)) {
    const out = type({
      model: Model
    })(JSON.parse(data));
    if (!(out instanceof type.errors)) {
      model = out.model;
    }
  }
  // const result = await db.chat.create({ data: { model } });
  const c = await ConversationService.create({ model, name: null, messages: [], archived: false });
  return Response.json(
    routes['create'].assert({
      ...c,
      updated_at: c.updated_at.toISOString()
    } satisfies typeof routes.create.infer)
  );
}
