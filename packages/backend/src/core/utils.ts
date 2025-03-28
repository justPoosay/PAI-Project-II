import { MessageChunk, Model, models } from 'common';
import { env } from '../lib/utils';

export function getAvailableModels() {
  return Object.entries(models)
    .filter(v => !!env[v[1].env as keyof typeof env])
    .map(v => v[0] as typeof Model.infer);
}

export function getTextContent(chunks: (typeof MessageChunk.infer)[]) {
  return chunks.map(v => (v?.type === 'text-delta' ? v.textDelta : '')).join('');
}
