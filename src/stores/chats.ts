import { defineStore } from "pinia";
import { ref } from "vue";
import type { Chat } from "@/lib/types";

export const useChatStore = defineStore("chat", () => {
  const chats = ref<Chat[]>([]);
  
  const fetchChats = async () => {
    const response = await fetch("/api/chats");
    chats.value = await response.json();
  };
  
  fetchChats().then();
  
  return {
    chats,
  };
});