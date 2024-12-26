import { defineStore } from "pinia";
import { ref } from "vue";
import { routes } from "../../shared/schemas.ts";
import { z } from "zod";

export const useChatStore = defineStore("chat", () => {
  const chats = ref<z.infer<typeof routes["chats.json"]>>([]);
  
  async function $fetch() {
    try {
      const res = await fetch("/api/chats.json");
      if(!res.ok) throw new Error("Failed to fetch chats");
      const result = routes["chats.json"].safeParse(await res.json());
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