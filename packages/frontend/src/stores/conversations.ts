import type { Conversation as TConversation } from '@/lib/types.ts';
import { isBackendAlive } from '@/lib/utils.ts';
import { type } from 'arktype';
import { Conversation, Model, routes } from 'common';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useConversationStore = defineStore('conversations', () => {
  const conversations = ref<TConversation[]>([]);
  const error = ref<string | null>();

  async function $fetch() {
    try {
      const res = await fetch('/api/conversations');
      if (!res.ok) {
        const alive = await isBackendAlive();
        if (!alive) throw new Error('Backend seems to be dead');
        throw new Error(res.statusText);
      }
      const out = routes['conversations'](await res.json());
      if (out instanceof type.errors) throw new Error('Backend provided bogus data');
      conversations.value = out.map(c => ({ ...c, updated_at: new Date(c.updated_at) }));
      error.value = null;
    } catch (e) {
      if (e instanceof Error) {
        error.value = e.message;
      }
    }
  }

  async function $create(data: { model?: typeof Model.infer } = {}): Promise<TConversation> {
    const res = await fetch('/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create a new conversation');
    const out = routes['create'](await res.json());
    if (out instanceof type.errors) throw new Error('Backend provided bogus data');
    const c = {
      ...out,
      updated_at: new Date(out.updated_at)
    } satisfies TConversation;
    conversations.value.unshift(c);
    return c;
  }

  type ModifyData = {
    id: string;
    name?: string | null;
    model?: typeof Model.infer;
    requestChange?: boolean;
  };

  async function $modify({ id, requestChange = true, ...data }: ModifyData) {
    const index = conversations.value.findIndex(c => c.id === id);

    if (requestChange) {
      const res = await fetch(`/api/${id}/modify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) return;
      const out = Conversation(await res.json());
      if (!(out instanceof type.errors)) {
        conversations.value[index] = {
          ...out,
          updated_at: new Date(out.updated_at)
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
