import { type } from 'arktype';
import { Model, routes } from 'common';
import express from 'express';
import { getAvailableModels } from '~/core/utils';
import { ConversationService } from '~/lib/database';
import logger from '~/lib/logger';
import { isValidJSON } from '~/lib/utils';

export const create = express.Router();

create.post('/', async (req, res) => {
  let model = getAvailableModels()[0];
  const data = await req.body();
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
  res.json(
    routes['create'].assert({
      ...c,
      updated_at: c.updated_at.toISOString()
    } satisfies typeof routes.create.infer)
  );
});
