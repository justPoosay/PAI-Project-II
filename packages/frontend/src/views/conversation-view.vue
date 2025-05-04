<template>
  <div
    class="bg-sidebar-light text-text-primary-light dark:bg-sidebar-dark dark:text-text-primary-dark flex h-full overflow-hidden"
  >
    <Sidebar v-model="isSidebarExpanded" />
    <div
      :data-s="isSidebarExpanded"
      class="flex flex-1 animate-[rotate-gradient_5s_linear_infinite] overflow-hidden rounded-tl-xl border-transparent bg-clip-padding shadow-md transition-[margin] [--bg:var(--color-bg-light)] [background:linear-gradient(var(--bg),var(--bg))_padding-box,linear-gradient(var(--angle,225deg),#FF000E,#FF7300,#FAD220,#138F3E,#3558A0,#880082)_border-box] lg:data-[s=true]:mt-3 lg:data-[s=true]:border-t-2 lg:data-[s=true]:border-l-2 dark:[--bg:var(--color-bg-dark)] dark:lg:data-[s=true]:border-t dark:lg:data-[s=true]:border-l"
    >
      <Conversation />
    </div>
  </div>
</template>

<script setup lang="ts">
import Conversation from '@/components/conversation-main.vue';
import Sidebar from '@/components/sidebar.vue';
import { ref } from 'vue';

const isSidebarExpanded = ref(true);
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
