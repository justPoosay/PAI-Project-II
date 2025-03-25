import type { Conversation } from '@/lib/types.ts';
import { isBackendAlive } from '@/lib/utils.ts';
import { ConversationSchema, routes, type Model } from 'common';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useConversationStore = defineStore('conversations', () => {
  const conversations = ref<Conversation[]>([]);
  const error = ref<string | null>();

  async function $fetch() {
    try {
      const res = await fetch('/api/conversations');
      if (!res.ok) {
        const alive = await isBackendAlive();
        if (!alive) throw new Error('Backend seems to be dead');
        throw new Error(res.statusText);
      }
      const result = routes['conversations'].safeParse(await res.json());
      if (!result.success) throw new Error('Backend provided bogus data');
      conversations.value = result.data.map(c => ({ ...c, updated_at: new Date(c.updated_at) }));
      error.value = null;
    } catch (e) {
      if (e instanceof Error) {
        error.value = e.message;
      }
    }
  }

  async function $create(data: { model?: Model } = {}): Promise<Conversation> {
    const res = await fetch('/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create a new conversation');
    const result = routes['create'].safeParse(await res.json());
    if (!result.success) throw new Error('Backend provided bogus data');
    const c = {
      ...result.data,
      updated_at: new Date(result.data.updated_at)
    } satisfies Conversation;
    conversations.value.unshift(c);
    return c;
  }

  type ModifyData = { id: string; name?: string | null; model?: Model; requestChange?: boolean };

  async function $modify({ id, requestChange = true, ...data }: ModifyData) {
    const index = conversations.value.findIndex(c => c.id === id);

    if (requestChange) {
      const res = await fetch(`/api/${id}/modify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) return;
      const result = ConversationSchema.safeParse(await res.json());
      if (result.success) {
        conversations.value[index] = {
          ...result.data,
          updated_at: new Date(result.data.updated_at)
        };
      }
      return;
    }

    conversations.value[index] = { ...conversations.value[index], ...data };
  }

  return {
    conversations,
    $fetch,
    error,
    $create,
    $modify
  };
});
