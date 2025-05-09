import { type } from 'arktype';
import { Effort, Model } from 'common';
import { pick } from 'common/utils';
import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { stringify } from 'superjson';
import { ChatService } from '../lib/db';
import logger from '../lib/logger';

export const chatRouter = Router();

// trpc.chat.delete -> void
chatRouter.delete('/:id', async (req, res) => {
  if (!req.session?.user) {
    return void res.status(401).send();
  }

  const _id = type('string.hex==24').pipe(id => new ObjectId(id))(req.params.id);
  if (_id instanceof type.errors) {
    return void res.status(400).send(_id.summary);
  }

  const userId = new ObjectId(req.session.user.id);

  try {
    const updated = await ChatService.updateOne({ _id, userId }, { deleted: true, userId }, true);

    if (!updated) {
      return void res.status(404).send();
    }

    res.status(204).send();
  } catch (err) {
    logger.error(`[DELETE /chat/:id] ${err}`);
    res.status(500).send();
  }
});

// trpc.chat.modify -> Chat | null
chatRouter.patch('/:id', async (req, res) => {
  if (!req.session?.user) {
    return void res.status(401).send();
  }

  const _id = type('string.hex==24').pipe(id => new ObjectId(id))(req.params.id);
  if (_id instanceof type.errors) {
    return void res.status(400).send(_id.summary);
  }

  const input = type({
    'name?': 'string | null',
    'model?': Model,
    'reasoningEffort?': Effort,
    'pinned?': 'boolean'
  })(req.query);
  if (input instanceof type.errors) {
    return void res.status(400).send(input.summary);
  }

  try {
    const updated = await ChatService.updateOne(
      { _id, deleted: false, userId: new ObjectId(req.session.user.id) },
      input
    );

    if (!updated) {
      return void res.status(404).send();
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(stringify(updated));
  } catch (err) {
    logger.error(`[PATCH /chat/:id] ${err}`);
    res.status(500).send();
  }
});

// trpc.chat.get -> Chat | null
chatRouter.get('/:id', async (req, res) => {
  if (!req.session?.user) {
    return void res.status(401).send();
  }

  const _id = type('string.hex==24').pipe(id => new ObjectId(id))(req.params.id);
  if (_id instanceof type.errors) {
    return void res.status(400).send(_id.summary);
  }

  try {
    const chat = await ChatService.findOne({
      _id,
      deleted: false,
      userId: new ObjectId(req.session.user.id)
    });

    if (!chat) {
      return void res.status(404).send();
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(stringify(chat));
  } catch (err) {
    logger.error(`[GET /chat/:id] ${err}`);
    res.status(500).send();
  }
});

// trpc.chat.list -> Pick<Chat, '_id' | 'name' | 'pinned' | 'updatedAt'>[]
chatRouter.get('/', async (req, res) => {
  if (!req.session?.user) {
    return void res.status(401).send();
  }

  try {
    const chats = await ChatService.find({
      userId: new ObjectId(req.session.user.id),
      deleted: false
    });

    res.setHeader('Content-Type', 'application/json');
    res.send(stringify(chats.map(c => pick(c, ['_id', 'name', 'pinned', 'updatedAt']))));
  } catch (err) {
    logger.error(`[GET /chat] ${err}`);
    res.status(500).send();
  }
});

// trpc.chat.new -> Chat
chatRouter.post('/', async (req, res) => {
  if (!req.session?.user) {
    return void res.status(401).send();
  }

  try {
    const inserted = await ChatService.insertOne({
      name: null,
      messages: [],
      deleted: false,
      updatedAt: new Date(),
      userId: new ObjectId(req.session.user.id)
    });

    res.setHeader('Content-Type', 'application/json');
    res.status(201).send(stringify(inserted));
  } catch (err) {
    logger.error(`[POST /chat] ${err}`);
    res.status(500).send();
  }
});
