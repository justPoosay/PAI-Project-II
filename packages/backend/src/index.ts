import { SSE } from 'common';
import express from 'express';
import EventEmitter from 'node:events';
import { messages } from './app/[id]/messages';
import { conversations } from './app/conversations';
import { modify } from './app/[id]/modify';
import { create } from './app/create';


export const emitter = new EventEmitter<{
  sse: [data: typeof SSE.infer];
}>();

setInterval(() => {
  emitter.emit('sse', { kind: 'keep-alive' });
}, 20000);

const app = express();

app.use('/messages', messages);
app.use('/conversations', conversations);
app.use('/modify', modify);
app.use('/create', create);


app.listen(3000);
