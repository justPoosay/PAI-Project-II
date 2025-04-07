import { type } from 'arktype';
import { Conversation, Model } from 'common';
import express from 'express';
import { ConversationService } from '~/lib/database';
import { isValidJSON } from '~/lib/utils';

export const modify = express.Router();

modify.delete('/:id', async (req, res) => {
  await ConversationService.update(req.route.params.id, { archived: true });
  res.status(204).send(null);
});

modify.patch('/:id', async (req, res) => {
  const userSuppliedData = await req.body();
  if (!isValidJSON(userSuppliedData)) {
    res.status(400).send(null);
    return;
  }
  const out = type({
    'name?': 'string | null',
    'model?': Model
  })(JSON.parse(userSuppliedData));
  if (out instanceof type.errors) {
    res.status(400).send(null);
    return;
  }

  const updated = await ConversationService.update(req.route.params.id, out);
  res.json(Conversation.assert({ ...updated, updated_at: updated?.updated_at.toISOString() }));
});

export const pre = () => {
  return async (req: any, res: any)=> {
    const c = await ConversationService.findOne(req.params.id, { archived: false });
    if (!c) { res.status(404).send(null); return;}
    return null;
  }
}

