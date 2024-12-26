<template>
  <div
    :data-expanded="isExpanded"
    class="bg-gradient-to-b from-white/10 via-white/5 to-white/10 backdrop-blur-sm transition-all duration-300 ease-in-out w-16 shadow-sm data-[expanded=true]:w-64 rounded-r-xl text-white/75"
  >
    <div class="p-2">
      <div class="flex justify-between items-center mb-4">
        <button
          @click="createNewChat"
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
      <ul>
        <li v-for="chat in chats" :key="chat.id" class="mb-2">
          <RouterLink
            :to="`/c/${chat.id}`"
            :data-expanded="isExpanded"
            class="block py-2 px-2 rounded transition from-white/10 from-75% to-white/15 hover:bg-gradient-to-br data-[expanded=false]:text-center"
            :title="!isExpanded ? chat.name : ''"
          >
            <span v-if="isExpanded">{{ chat.name ?? "Untitled" }}</span>
            <span v-else>{{ (chat.name ?? "Untitled").charAt(0) }}</span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-vue-next";
import { useChatStore } from "@/stores/chats.ts";
import { storeToRefs } from "pinia";
import { routes } from "../../shared/schemas.ts";
import router from "@/router";

const isExpanded = ref(true);

const chatStore = useChatStore();
const { chats } = storeToRefs(chatStore);

onMounted(() => {
  chatStore.$fetch();
});

function toggleSidebar() {
  isExpanded.value = !isExpanded.value;
}

async function createNewChat() {
  try {
    const res = await fetch("/api/create", { method: "POST" });
    if(!res.ok) throw new Error("Failed to create a new chat");
    const result = routes["create"].safeParse(await res.json());
    if(!result.success) throw new Error("Backend provided bogus data");
    const chat = result.data;
    chatStore.chats.push(chat);
    await router.push({ name: "c", params: { id: chat.id } });
  } catch(e) {
    console.error(e);
  }
}
</script>

