<template>
  <div class="flex h-screen selection:bg-white/10 text-white bg-[url('/img/DarkestHour.webp')]">
    <Sidebar/>
    <ChatInterface/>
  </div>
</template>

<script setup lang="ts">
import ChatInterface from "@/components/ConversationInterface.vue";
import Sidebar from "@/components/Sidebar.vue";
</script>