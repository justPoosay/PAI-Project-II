<template>
  <div
    class="flex h-full text-[#333333] bg-[#DDE6F0] dark:text-white dark:bg-[#2A1F2A] overflow-hidden"
  >
    <Suspense>
      <ConversationWrapper />

      <template #fallback>
        <div v-if="!error" class="w-full h-full flex items-center justify-center">
          <Loader />
        </div>
        <div v-else class="w-full h-full flex items-center justify-center">
          <div class="text-center">
            <h1 class="text-2xl font-bold">Encountered error while fetching vital data</h1>
            <p class="text-lg">{{ error }}</p>
          </div>
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script setup lang="ts">
import ConversationWrapper from '@/components/conversation-wrapper.vue';
import Loader from '@/components/loader.vue';
import { useConversationStore } from '@/stores/conversations.ts';
import { useModelStore } from '@/stores/models.ts';
import { ref } from 'vue';

const error = ref<string | null>(null);

useModelStore().$subscribe(function (_, { error: e }) {
  error.value = e ?? null;
});

useConversationStore().$subscribe(function (_, { error: e }) {
  error.value = e ?? null;
});
</script>
