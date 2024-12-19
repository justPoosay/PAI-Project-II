<script setup lang="ts">
import { ref } from "vue";

let open = ref(false);
</script>

<template>
  <div role="complementary" class="fixed h-full" :data-open="open">
    <div class="w-10 h-10 flex items-center justify-center">+</div>
  </div>
</template>