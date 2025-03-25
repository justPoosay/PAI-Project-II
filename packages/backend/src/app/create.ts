import { ModelSchema, routes, type Model } from 'shared';
import { z } from 'zod';
import { getAvailableModels } from '~/core/utils';
import { ConversationService } from '~/lib/database';
import logger from '~/lib/logger';
import type { AppRequest } from '~/lib/types';
import { isValidJSON } from '~/lib/utils';

export async function POST(req: AppRequest): Promise<Response> {
  let model: Model = getAvailableModels()[0];
  const data = await req.text();
  logger.trace('/create', { data });
  if (isValidJSON(data)) {
    const result = z
      .object({
        model: ModelSchema
      })
      .safeParse(JSON.parse(data));
    if (result.success) {
      model = result.data.model;
    }
  }
  // const result = await db.chat.create({ data: { model } });
  const c = await ConversationService.create({ model, name: null, messages: [], archived: false });
  return Response.json(
    routes['create'].parse({
      ...c,
      updated_at: c.updated_at.toISOString()
    } satisfies z.infer<(typeof routes)['create']>)
  );
}
