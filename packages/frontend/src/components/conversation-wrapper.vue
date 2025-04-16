<template>
  <Sidebar v-model="isSidebarExpanded" />
  <div
    :data-s="isSidebarExpanded"
    class="flex-1 flex overflow-hidden [--bg:#E7F0F8] dark:[--bg:#352A35] rounded-tl-xl transition-[margin] duration-100 shadow-md lg:data-[s=true]:mt-3 lg:data-[s=true]:border-t-2 lg:data-[s=true]:border-l-2 dark:lg:data-[s=true]:border-t dark:lg:data-[s=true]:border-l border-transparent bg-clip-padding [background:linear-gradient(var(--bg),var(--bg))_padding-box,linear-gradient(var(--angle,225deg),#FF000E,#FF7300,#FAD220,#138F3E,#3558A0,#880082)_border-box] animate-[rotate-gradient_10s_linear_infinite]"
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

const isSidebarExpanded = ref(true);

const conversationStore = useConversationStore();
await conversationStore.$fetch();

const modelStore = useModelStore();
await modelStore.$fetch();
</script>

<style lang="sass">
@keyframes rotate-gradient
  0%
    --angle: 0deg
  100%
    --angle: 360deg

@property --angle
  syntax: '<angle>'
  initial-value: 225deg
  inherits: false
</style>
