import { defineStore } from "pinia";
import { ref } from "vue";
import { routes } from "../../shared/schemas.ts";
import type { Conversation } from "@/lib/types.ts";

export const useConversationStore = defineStore("conversations", () => {
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
  
  async function $create(): Promise<Conversation> {
    const res = await fetch("/api/create", { method: "POST" });
    if(!res.ok) throw new Error("Failed to create a new conversation");
    const result = routes["create"].safeParse(await res.json());
    if(!result.success) throw new Error("Backend provided bogus data");
    const c = { ...result.data, updated_at: new Date(result.data.updated_at) } satisfies Conversation;
    conversations.value.unshift(c);
    return c;
  }
  
  async function $rename(id: string, name: string, request = true) {
    if(request) {
      const res = await fetch(`/api/${id}/modify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if(!res.ok) return;
    }
    const conversation = conversations.value.find(c => c.id === id);
    if(conversation) conversation.name = name;
  }
  
  return {
    conversations,
    $fetch,
    $create,
    $rename
  };
});