import { trpc } from '@/lib/trpc';
import { Conversation, Model } from 'common';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useConversationStore = defineStore('conversations', () => {
  const conversations = ref<(typeof Conversation.infer)[]>([]);

  async function $fetch() {
    conversations.value = await trpc.conversations.get.query();
  }

  async function $create(
    data: { model?: typeof Model.infer } = {}
  ): Promise<typeof Conversation.infer> {
    const c = await trpc.conversations.create.mutate(data);
    conversations.value.unshift(c);
    return c;
  }

  type ModifyData = {
    requestChange?: boolean;
  } & Parameters<typeof trpc.conversation.modify.mutate>[0];

  async function $modify({ requestChange = true, ...data }: ModifyData) {
    const index = conversations.value.findIndex(c => c.id === data.id);

    if (requestChange) {
      const c = await trpc.conversation.modify.mutate(data);
      if (c) {
        conversations.value[index] = c;
      }
      return;
    }

    conversations.value[index] = {
      ...conversations.value[index]!,
      ...data,
      updated_at: new Date()
    };
  }

  return {
    conversations,
    $fetch,
    $create,
    $modify
  };
});
