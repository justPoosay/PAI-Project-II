import { SSE } from 'common';
import Express from 'express';
import EventEmitter from 'node:events';
import logger from '~/lib/logger';
import { IDRouter } from '~/routes/id';
import { slashRouter } from '~/routes/slash';

// doesn't do jack shit (beside spamming errors in the browser console), but I cbb to fix it
export const emitter = new EventEmitter<{
  sse: [data: typeof SSE.infer];
}>();

// neither does this
setInterval(() => {
  emitter.emit('sse', { kind: 'keep-alive' });
}, 20000);

const express = Express();

// mom, can we have body-parser? no. we have body-parser at home. body-parser at home:
express.use((req, _, next) => {
  let data = '';
  req.on('data', chunk => {
    data += chunk;
  });
  req.on('end', () => {
    req.body = data;
    next();
  });
});

express.use((req, _, next) => {
  logger.info(req.ip, req.method, req.path);
  logger.debug(req.body);

  next();
});

express.get('/alive', (_, res) => {
  res.status(200).send();
});

express.use('/', slashRouter);
express.use('/:id', IDRouter);

express.listen(3000);
