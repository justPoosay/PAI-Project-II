<template>
  <div class="flex h-full selection:bg-white/10 text-white bg-[url('/img/bg/Elarun.webp')] bg-cover bg-center bg-origin-border">
    <Suspense>
      <ConversationWrapper/>

      <template #fallback>
        <div
          v-if="!error"
          class="w-full h-full flex items-center justify-center"
        >
          <Loader/>
        </div>
        <div
          v-else
          class="w-full h-full flex items-center justify-center"
        >
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
import { ref } from "vue";
import ConversationWrapper from "@/components/ConversationWrapper.vue";
import { useModelStore } from "@/stores/models.ts";
import { useConversationStore } from "@/stores/conversations.ts";
import Loader from "@/components/Loader.vue";

const error = ref<string | null>(null);

useModelStore().$subscribe(function(_, { error: e }) {
  error.value = e!;
});

useConversationStore().$subscribe(function(_, { error: e }) {
  error.value = e!;
});
</script>