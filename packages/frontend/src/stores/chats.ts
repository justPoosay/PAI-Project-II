import { trpc } from '@/lib/trpc';
import { type Model } from 'common';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type Chat = Awaited<ReturnType<typeof trpc.chat.list.query>>[number];

export const useChatStore = defineStore('chats', () => {
  const chats = ref<Chat[]>([]);

  async function $fetch() {
    chats.value = await trpc.chat.list.query();
  }

  async function $create(data: { model?: Model } = {}) {
    const c = await trpc.chat.new.mutate(data);
    chats.value.unshift(c);
    return c;
  }

  type ModifyData = {
    requestChange?: boolean;
  } & Parameters<typeof trpc.chat.modify.mutate>[0];

  async function $modify({ requestChange = true, ...data }: ModifyData) {
    const index = chats.value.findIndex(c => String(c._id) === data.id);

    if (index === -1 || !chats.value[index] || chats.value[index].deleted) {
      return;
    }

    if (requestChange) {
      const c = await trpc.chat.modify.mutate(data);
      if (c) {
        chats.value[index] = c;
      }
      return;
    }

    chats.value[index] = {
      ...chats.value[index]!,
      ...data,
      updatedAt: new Date()
    };
  }

  return {
    chats,
    $fetch,
    $create,
    $modify
  };
});
