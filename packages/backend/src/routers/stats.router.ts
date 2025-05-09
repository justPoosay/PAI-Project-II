import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { stringify } from 'superjson';
import { ChatService } from '../lib/db';
import logger from '../lib/logger';

export const statsRouter = Router();

/**
 * @author: averithefox
 */
statsRouter.get('/chat', async (req, res) => {
  if (!req.session?.user) {
    return void res.status(401).send();
  }

  try {
    const userId = new ObjectId(req.session.user.id);
    const chats = await ChatService.find({ userId, deleted: false });
    const chatCount = chats.length;
    const messageCount = chats.reduce((sum, c) => sum + (c.messages?.length ?? 0), 0);

    res.setHeader('Content-Type', 'application/json');
    res.send(stringify({ chatCount, messageCount }));
  } catch (err) {
    logger.error(`[GET /stats/chat] ${err}`);
    res.status(500).send();
  }
});

/**
 * @author: averithefox
 */
statsRouter.get('/models', async (req, res) => {
  if (!req.session?.user) {
    return void res.status(401).send();
  }

  try {
    const userId = new ObjectId(req.session.user.id);
    const chats = await ChatService.find({ userId, deleted: false });
    const counts: Record<string, number> = {};
    for (const chat of chats) {
      const modelKey = chat.model ?? 'unknown';
      counts[modelKey] = (counts[modelKey] ?? 0) + 1;
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(stringify(counts));
  } catch (err) {
    logger.error(`[GET /stats/models] ${err}`);
    res.status(500).send();
  }
});
