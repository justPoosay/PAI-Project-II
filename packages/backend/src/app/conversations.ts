import { routes } from 'common';
import express from 'express';
import { ConversationService } from '~/lib/database';

export const conversations = express.Router();

conversations.get('/', async (req, res) => {
  const cs = await ConversationService.find({ archived: false });
  res.json(
    routes['conversations'].assert(
      cs
        .sort((a, b) => b!.updated_at.getTime() - a!.updated_at.getTime())
        .map(c => ({ ...c, updated_at: c!.updated_at.toISOString() }))
    )
  );
});
