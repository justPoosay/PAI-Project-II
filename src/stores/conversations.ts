import { defineStore } from "pinia";
import { ref } from "vue";
import { routes } from "../../shared/schemas.ts";
import { z } from "zod";

export const useConversationStore = defineStore("conversations", () => {
  type Conversation = Omit<z.infer<typeof routes["conversations"]>[0], "updated_at"> & { updated_at: Date };
  const conversations = ref<Conversation[]>([]);
  
  async function $fetch() {
    try {
      const res = await fetch("/api/conversations");
      if(!res.ok) throw new Error("Failed to fetch conversations");
      const result = routes["conversations"].safeParse(await res.json());
      if(!result.success) throw new Error("Backend provided bogus data");
      conversations.value = result.data.map(c => ({ ...c, updated_at: new Date(c.updated_at) }));
    } catch(e) {
      console.error(e);
    }
  }
  
  return {
    conversations,
    $fetch,
  };
});