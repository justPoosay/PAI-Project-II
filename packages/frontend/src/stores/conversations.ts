import { trpc } from '@/lib/trpc';
import { Conversation, Model } from 'common';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useConversationStore = defineStore('conversations', () => {
  const conversations = ref<(typeof Conversation.infer)[]>([]);
  const error = ref<string | null>();

  async function $fetch() {
    try {
      conversations.value = await trpc.conversations.get.query();
      error.value = null;
    } catch (e) {
      error.value = `${e}`;
    }
  }

  async function $create(
    data: { model?: typeof Model.infer } = {}
  ): Promise<typeof Conversation.infer> {
    const c = await trpc.conversations.create.mutate(data);
    conversations.value.unshift(c);
    return c;
  }

  type ModifyData = {
    id: string;
    name?: string | null;
    model?: typeof Model.infer;
    requestChange?: boolean;
  };

  async function $modify({ requestChange = true, ...data }: ModifyData) {
    const index = conversations.value.findIndex(c => c.id === data.id);

    if (requestChange) {
      const c = await trpc.conversation.modify.mutate(data);
      if (c) {
        conversations.value[index] = c;
      }
      return;
    }

    conversations.value[index] = { ...conversations.value[index], ...data, updated_at: new Date() };
  }

  return {
    conversations,
    $fetch,
    error,
    $create,
    $modify
  };
});
