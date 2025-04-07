import { routes } from 'common';
import express from 'express';
import { ConversationService } from '~/lib/database';

export const routerID = express.Router();

routerID.use((req, res, next) => {
  res.locals.id = req.params.id;
  next();
});

routerID.get('/messages', async (req, res) => {
  const { id } = req.params as { id: string };
  const c = await ConversationService.findOne(id, { archived: false });
  res.json(routes['[id]']['messages'].assert(c?.messages ?? []));
});
