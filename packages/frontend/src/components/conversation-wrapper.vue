<template>
  <Sidebar v-model="isSidebarExpanded" />
  <div
    :data-s="isSidebarExpanded"
    class="flex-1 flex overflow-hidden bg-[#FFF8E7] dark:bg-[#1F1A1F] rounded-tl-xl transition-[margin] duration-100 shadow-md lg:data-[s=true]:mt-3 lg:data-[s=true]:border-t lg:data-[s=true]:border-l lg:data-[s=true]:border-[#FFD700] lg:data-[s=true]:dark:border-[#FF69B4]/35"
  >
    <Conversation />
  </div>
</template>

<script setup lang="ts">
import Conversation from '@/components/conversation-main.vue';
import Sidebar from '@/components/sidebar.vue';
import { useConversationStore } from '@/stores/conversations.ts';
import { useModelStore } from '@/stores/models.ts';
import { ref } from 'vue';

const isSidebarExpanded = ref(false);

const conversationStore = useConversationStore();
await conversationStore.$fetch();

const modelStore = useModelStore();
await modelStore.$fetch();
</script>
