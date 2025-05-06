import { type MessageChunk, models } from 'common';
import { entries } from 'common/utils';
import { env } from '../lib/env';

export function getAvailableModels() {
  return entries(models)
    .filter(v => !!env[v[1].provider.env])
    .map(v => v[0]);
}

export function getTextContent(chunks: MessageChunk[]) {
  return chunks.map(v => (v?.type === 'text-delta' ? v.textDelta : '')).join('');
}
