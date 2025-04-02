import { pick } from 'common/utils';
import { closeDB } from '../lib/database';
import { ConversationService } from '../lib/database/services/ConversationService';

export default async function addTerminatingNullChunk() {
  const conversations = await ConversationService.find();
  const updated = conversations.map(c => ({
    ...c,
    messages: c.messages.map(m =>
      m.role === 'assistant'
        ? { ...m, chunks: m.chunks[m.chunks.length - 1] === null ? m.chunks : [...m.chunks, null] }
        : m
    )
  }));

  await Promise.all(updated.map(c => ConversationService.update(c.id, pick(c, ['messages']))));

  await closeDB();
}

if (import.meta.main) {
  await addTerminatingNullChunk();
}
