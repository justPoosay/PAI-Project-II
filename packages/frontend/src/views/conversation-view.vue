<template>
  <div
    class="flex h-full light:selection:bg-white/10 text-white dark:bg-vue-black-soft dark:bg-none bg-[url('/img/bg/Elarun.webp')] bg-cover bg-center bg-origin-border overflow-hidden"
  >
    <Suspense>
      <ConversationWrapper />

      <template #fallback>
        <div v-if="!error" class="w-full h-full flex items-center justify-center">
          <Loader />
        </div>
        <div v-else class="w-full h-full flex items-center justify-center">
          <div class="text-center text-white/75">
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
