<template>
  <div
      :class="[
      'bg-vue-black-soft border-r border-vue-black-mute transition-all duration-300 ease-in-out',
      isExpanded ? 'w-64' : 'w-16'
    ]"
  >
    <div class="p-4">
      <div class="flex justify-between items-center mb-4">
        <button
            @click="createNewChat"
            class="p-2 bg-indigo text-vue-white rounded-full hover:bg-opacity-80 transition"
            :title="isExpanded ? 'New Chat' : ''"
        >
          <PlusIcon class="w-5 h-5" />
        </button>
        <button
            @click="toggleSidebar"
            class="p-2 text-vue-white-soft hover:bg-vue-black-mute rounded-full transition"
        >
          <ChevronLeftIcon v-if="isExpanded" class="w-5 h-5" />
          <ChevronRightIcon v-else class="w-5 h-5" />
        </button>
      </div>
      <h2 v-if="isExpanded" class="text-xl font-semibold mb-4 text-vue-white">Chats</h2>
      <ul>
        <li v-for="chat in chats" :key="chat.id" class="mb-2">
          <a
              :href="chat.link"
              :class="[
              'block p-2 rounded transition text-vue-white-soft',
              isExpanded ? 'hover:bg-vue-black-mute' : 'text-center hover:bg-vue-black-mute'
            ]"
              :title="!isExpanded ? chat.name : ''"
          >
            <span v-if="isExpanded">{{ chat.name ?? "Untitled" }}</span>
            <span v-else>{{ (chat.name ?? "Untitled").charAt(0) }}</span>
          </a>
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

const isExpanded = ref(true);

const chatStore = useChatStore();
const { chats } = storeToRefs(chatStore);

onMounted(() => {
  chatStore.$fetch();
});

const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value;
};

const createNewChat = () => {
  // Implement new chat creation logic here
  console.log("Creating new chat");
};
</script>