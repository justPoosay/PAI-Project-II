<template>
  <div
    :data-expanded="isExpanded"
    class="flex flex-col bg-gradient-to-b from-white/10 via-white/5 to-white/10 backdrop-blur-sm transition-all duration-300 ease-in-out w-16 shadow-sm data-[expanded=true]:w-64 rounded-r-xl text-white/75 h-screen"
  >
    <div class="p-2 flex flex-col h-full">
      <div class="flex justify-between items-center mb-4">
        <button
          @click="createNewConversation"
          class="p-2 bg-indigo rounded-full hover:bg-opacity-80 transition"
          :title="isExpanded ? 'New Chat' : ''"
        >
          <PlusIcon class="w-5 h-5"/>
        </button>
        <button
          @click="toggleSidebar"
          class="p-2 w-full flex justify-end hover:bg-vue-black-mute transition"
        >
          <ChevronLeftIcon v-if="isExpanded" class="w-5 h-5"/>
          <ChevronRightIcon v-else class="w-5 h-5"/>
        </button>
      </div>
      <ul class="space-y-1 px-1 h-[calc(100vh-4rem)] overflow-y-auto">
        <li v-for="c in conversations" :key="c.id">
          <RouterLink
            :to="`/c/${c.id}`"
            :data-expanded="isExpanded"
            class="block py-2 px-2 rounded transition from-white/10 from-75% to-white/15 hover:bg-gradient-to-br data-[expanded=false]:text-center overflow-hidden"
            :title="!isExpanded ? c.name : ''"
          >
            <span v-if="isExpanded" class="block truncate">{{ c.name ?? "Untitled" }}</span>
            <span v-else>{{ (c.name ?? "Untitled").charAt(0) }}</span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-vue-next";
import { useConversationStore } from "@/stores/conversations.ts";
import { storeToRefs } from "pinia";
import { routes } from "../../shared/schemas.ts";
import router from "@/router";

const isExpanded = ref(true);

const conversationStore = useConversationStore();
const { conversations } = storeToRefs(conversationStore);

onMounted(() => {
  conversationStore.$fetch();
});

function toggleSidebar() {
  isExpanded.value = !isExpanded.value;
}

async function createNewConversation() {
  try {
    const res = await fetch("/api/create", { method: "POST" });
    if(!res.ok) throw new Error("Failed to create a new conversation");
    const result = routes["create"].safeParse(await res.json());
    if(!result.success) throw new Error("Backend provided bogus data");
    const c = result.data;
    conversationStore.conversations.push({ ...c, updated_at: new Date(c.updated_at) });
    await router.push({ name: "c", params: { id: c.id } });
  } catch(e) {
    console.error(e);
  }
}
</script>

