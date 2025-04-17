<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform translate-y-4 opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-300 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-4 opacity-0"
  >
    <div
      v-if="show"
      class="absolute bottom-32 left-1/2 z-20 -translate-x-1/2 rounded-lg bg-red-500/75 px-4 py-2 text-white shadow-lg backdrop-blur-sm"
    >
      <h5 class="font-semibold">{{ error?.title }}</h5>
      <p>{{ error?.message }}</p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { SSE } from 'common';

defineProps<{
  show: boolean;
  error: Omit<Extract<typeof SSE.infer, { kind: 'error' }>, 'kind' | 'for'> | null;
}>();
</script>
