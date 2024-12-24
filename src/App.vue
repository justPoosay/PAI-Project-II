<script setup lang="ts">
import { RouterView } from 'vue-router'
import Sidebar from "@/components/Sidebar.vue";
</script>

<template>
  <main class="h-full bg-vue-black-soft flex flex-row">
    <Sidebar />
    <RouterView />
  </main>
</template>