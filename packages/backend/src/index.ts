import { SSE } from 'common';
import express from 'express';
import EventEmitter from 'node:events';
import { conversations } from './app/conversations';
import { create } from './app/create';
import { getAvailableModels } from './core/utils';
import { routerID } from './app/[id]/messages';
import { routerIDmodify } from './app/[id]/modify';


export const emitter = new EventEmitter<{
  sse: [data: typeof SSE.infer];
}>();

setInterval(() => {
  emitter.emit('sse', { kind: 'keep-alive' });
}, 20000);

const app = express();

app.use('/:id', routerID);
app.use('/conversations', conversations);
app.use('/:id', routerIDmodify);
app.use('/create', create);

app.get('/models', (_ , res) => {
  res.json(getAvailableModels())
})

app.get('/alive', (_, res) => {
  res.status(200).send()
})

app.listen(3000);
