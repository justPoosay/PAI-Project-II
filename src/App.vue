<script setup lang="ts">
import { RouterView } from 'vue-router'
import Sidebar from "@/components/Sidebar.vue";
</script>

<template>
  <main class="h-full bg-vue-black-soft">
    <Sidebar />
    <RouterView />
  </main>
</template>