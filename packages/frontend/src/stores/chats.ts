import { query, type routes } from '@/lib/api';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type Chat = (typeof routes)['GET /chat/']['o']['inferOut'][number];

export const useChatStore = defineStore('chats', () => {
  const chats = ref<Chat[]>([]);

  async function $fetch() {
    const result = await query('GET /chat/');
    if (result.isOk()) {
      chats.value = result.value;
    } else {
      console.error('Failed to fetch chats:', result.error);
    }
    return result;
  }

  async function $create() {
    const result = await query('POST /chat/');
    if (result.isOk()) {
      chats.value.unshift(result.value);
      return result;
    }
    return result;
  }

  async function $modify(input: (typeof routes)['PATCH /chat/:id']['i']['inferOut']) {
    const index = chats.value.findIndex(c => c._id.toHexString() === input.id);

    if (index === -1 || !chats.value[index]) {
      return;
    }

    const c = await query('PATCH /chat/:id', input);
    if (c.isOk() && c.value) {
      chats.value[index] = c.value;
    }

    return c;
  }

  async function $delete(id: string) {
    const c = await query('DELETE /chat/:id', { id });
    if (c.isOk()) {
      const index = chats.value.findIndex(c => c._id.toHexString() === id);
      if (index === -1 || !chats.value[index]) {
        return;
      }
      chats.value.splice(index, 1);
    }
    return c;
  }

  return {
    chats,
    $fetch,
    $create,
    $modify,
    $delete
  };
});
