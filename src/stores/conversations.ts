import { defineStore } from "pinia";
import { ref } from "vue";
import { routes } from "../../shared/schemas.ts";
import { z } from "zod";

export const useConversationStore = defineStore("conversations", () => {
  const chats = ref<z.infer<typeof routes["conversations"]>>([]);
  
  async function $fetch() {
    try {
      const res = await fetch("/api/conversations");
      if(!res.ok) throw new Error("Failed to fetch chats");
      const result = routes["conversations"].safeParse(await res.json());
      if(!result.success) throw new Error("Backend provided bogus data");
      chats.value = result.data;
    } catch(e) {
      console.error(e);
    }
  }
  
  return {
    chats,
    $fetch,
  };
});