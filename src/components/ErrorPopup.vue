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
      class="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-lg bg-red-500/75 backdrop-blur-sm text-white shadow-lg"
    >
      <h5 class="font-semibold">{{ `${error?.title}${error?.pof ? ` (@${error?.pof}` : ""})` }}</h5>
      <p>{{ error?.message }}</p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { ClientBoundWebSocketMessage } from "../../shared";

defineProps<{
  show: boolean
  error: Omit<Extract<ClientBoundWebSocketMessage, { role: "error" }>, "role"> | null
}>();
</script>