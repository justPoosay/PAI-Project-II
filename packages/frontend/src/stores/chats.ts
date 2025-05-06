import { trpc } from '@/lib/api';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type Chat = Awaited<ReturnType<typeof trpc.chat.list.query>>[number];

export const useChatStore = defineStore('chats', () => {
  const chats = ref<Chat[]>([]);

  async function $fetch() {
    chats.value = await trpc.chat.list.query();
  }

  async function $create(data: Parameters<typeof trpc.chat.new.mutate>[0] = {}) {
    const c = await trpc.chat.new.mutate(data);
    chats.value.unshift(c);
    return c;
  }

  async function $modify(input: Parameters<typeof trpc.chat.modify.mutate>[0]) {
    const index = chats.value.findIndex(c => c._id.toHexString() === input.id);

    if (index === -1 || !chats.value[index]) {
      return;
    }

    const c = await trpc.chat.modify.mutate(input);
    if (c) {
      chats.value[index] = c;
    }
    return;
  }

  async function $delete(id: string) {
    await trpc.chat.delete.mutate({ id });
    const index = chats.value.findIndex(c => c._id.toHexString() === id);
    if (index === -1 || !chats.value[index]) {
      return;
    }
    chats.value.splice(index, 1);
  }

  return {
    chats,
    $fetch,
    $create,
    $modify,
    $delete
  };
});
