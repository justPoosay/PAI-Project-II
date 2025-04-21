import { trpc } from '@/lib/trpc';
import { Model } from 'common';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type Conversation =
  Awaited<ReturnType<typeof trpc.conversation.list.query>> extends Array<infer T> ? T : never;

export const useConversationStore = defineStore('conversations', () => {
  const conversations = ref<Conversation[]>([]);

  async function $fetch() {
    conversations.value = await trpc.conversation.list.query();
    console.log('conversations', conversations.value);
  }

  async function $create(data: { model?: typeof Model.infer } = {}) {
    const c = await trpc.conversation.new.mutate(data);
    conversations.value.unshift(c);
    return c;
  }

  type ModifyData = {
    requestChange?: boolean;
  } & Parameters<typeof trpc.conversation.modify.mutate>[0];

  async function $modify({ requestChange = true, ...data }: ModifyData) {
    const index = conversations.value.findIndex(c => String(c._id) === data.id);

    if (index === -1 || !conversations.value[index] || conversations.value[index].deleted) {
      return;
    }

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
      updatedAt: new Date()
    };
  }

  return {
    conversations,
    $fetch,
    $create,
    $modify
  };
});
