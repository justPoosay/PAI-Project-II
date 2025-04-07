import { routes } from 'common';
import express from 'express';
import { ConversationService } from '~/lib/database';

export const messages = express.Router();

messages.get('/:id', async (req, res) => {
  const id = req.params.id;
  const c = await ConversationService.findOne(id, { archived: false });
  res.json(routes['[id]']['messages'].assert(c?.messages ?? []));
});
