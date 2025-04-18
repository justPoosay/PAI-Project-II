<template>
  <div
    class="flex h-full overflow-hidden bg-[#DDE6F0] text-[#333333] dark:bg-[#2A1F2A] dark:text-white"
  >
    <Sidebar v-model="isSidebarExpanded" />
    <div
      :data-s="isSidebarExpanded"
      class="flex flex-1 animate-[rotate-gradient_5s_linear_infinite] overflow-hidden rounded-tl-xl border-transparent bg-clip-padding shadow-md transition-[margin] [--bg:#E7F0F8] [background:linear-gradient(var(--bg),var(--bg))_padding-box,linear-gradient(var(--angle,225deg),#FF000E,#FF7300,#FAD220,#138F3E,#3558A0,#880082)_border-box] lg:data-[s=true]:mt-3 lg:data-[s=true]:border-l-2 lg:data-[s=true]:border-t-2 dark:[--bg:#352A35] dark:lg:data-[s=true]:border-l dark:lg:data-[s=true]:border-t"
    >
      <Conversation v-if="state === 'idle'" />
      <div v-else class="flex h-full w-full items-center justify-center">
        <Loader v-if="state === 'loading'" />
        <div v-else class="text-center">
          <button @click="loadModels" class="group text-sm font-semibold">
            <span class="block text-[#f82447] group-hover:hidden">Error</span>
            <span class="hidden text-[#55CDFC] group-hover:inline dark:text-[#F7A8B8]">
              Retry
            </span>
          </button>
          <p class="text-xs">check the browser console for details</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Conversation from '@/components/conversation-main.vue';
import Loader from '@/components/loader.vue';
import Sidebar from '@/components/sidebar.vue';
import { useModelStore } from '@/stores/models';
import { ref } from 'vue';

const isSidebarExpanded = ref(true);

const state = ref<'loading' | 'idle' | 'error'>('loading');
const modelStore = useModelStore();
loadModels();

function loadModels() {
  state.value = 'loading';
  modelStore
    .$fetch()
    .then(() => {
      state.value = 'idle';
    })
    .catch(e => {
      console.error(e);
      state.value = 'error';
    });
}
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
