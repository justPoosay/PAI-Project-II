<template>
  <div
    :data-expanded="isExpanded"
    class="bg-vue-black border-r border-vue-black-mute transition-all duration-300 ease-in-out w-16 data-[expanded=true]:w-64"
  >
    <div class="p-2">
      <div class="flex justify-between items-center mb-4">
        <button
          @click="createNewChat"
          class="p-2 bg-indigo text-vue-white rounded-full hover:bg-opacity-80 transition"
          :title="isExpanded ? 'New Chat' : ''"
        >
          <PlusIcon class="w-5 h-5"/>
        </button>
        <button
          @click="toggleSidebar"
          class="p-2 w-full flex justify-end text-vue-white-soft hover:bg-vue-black-mute transition"
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
            class="block py-2 px-2 rounded transition text-vue-white-soft hover:bg-vue-black-mute data-[expanded=false]:text-center"
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

