import { type } from 'arktype';
import { Model, routes } from 'common';
import { Router } from 'express';
import { emitter } from '~';
import { getAvailableModels } from '~/core/utils';
import { ConversationService } from '~/lib/database';
import logger from '~/lib/logger';
import { isValidJSON } from '~/lib/utils';

export const slashRouter = Router();

// probably won't work, but it's bun counterpart didn't work either, so...
slashRouter.get('/sse', async (_, res) => {
  const encoder = new TextEncoder();

  const listener: Parameters<typeof emitter.on<'sse'>>[1] = data => {
    try {
      res.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch (e) {}
  };

  emitter.on('sse', listener);
  res.on('close', () => emitter.off('sse', listener));

  // Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Transfer-Encoding', 'chunked');

  res.writeHead(200);
  res.write(
    encoder.encode(
      'Content-Type: text/event-stream\n' +
        'Cache-Control: no-cache\n' +
        'Connection: keep-alive\n\n'
    )
  );
});

slashRouter.get('/models', (_, res) => {
  res.json(getAvailableModels());
});

slashRouter.post('/', async (req, res) => {
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

slashRouter.get('/conversations', async (_, res) => {
  const cs = await ConversationService.find({ archived: false });
  res.json(
    routes['conversations'].assert(
      cs
        .sort((a, b) => b!.updated_at.getTime() - a!.updated_at.getTime())
        .map(c => ({ ...c, updated_at: c!.updated_at.toISOString() }))
    )
  );
});

slashRouter.post('/create', async (req, res) => {
  let model = getAvailableModels()[0];
  if (isValidJSON(req.body)) {
    const out = type({
      model: Model
    })(JSON.parse(req.body));
    if (!(out instanceof type.errors)) {
      model = out.model;
    }
  }
  const c = await ConversationService.create({ model, name: null, messages: [], archived: false });
  res.json(
    routes['create'].assert({
      ...c,
      updated_at: c.updated_at.toISOString()
    } satisfies typeof routes.create.infer)
  );
});
