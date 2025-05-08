import { query } from '@/lib/api';
import type { Result } from 'neverthrow';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type Chat = (Awaited<ReturnType<typeof query<'GET /chat/'>>> extends Result<infer T, unknown>
  ? T
  : never)[number];

export const useChatStore = defineStore('chats', () => {
  const chats = ref<Chat[]>([]);

  async function $fetch() {
    const result = await query('GET /chat/');
    if (result.isOk()) {
      chats.value = result.value;
    } else {
      console.error('Failed to fetch chats:', result.error);
    }
  }

  async function $create() {
    const result = await query('POST /chat/');
    if (result.isOk()) {
      chats.value.unshift(result.value);
      return result;
    }
    return result;
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
