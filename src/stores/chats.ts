import { defineStore } from "pinia";
import { ref } from "vue";
import type { Chat } from "@/lib/types";

export const useChatStore = defineStore("chat", () => {
  const chats = ref<Chat[]>([]);
  
  async function $fetch () {
    try {
      const response = await fetch("/api/chats");
      const json = await response.json();
      chats.value = json;
    } catch ( error ) {
    }
  }
  
  return {
    chats,
    $fetch,
  };
});