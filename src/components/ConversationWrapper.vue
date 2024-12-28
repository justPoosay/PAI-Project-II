<template>
  <Sidebar/>
  <Conversation/>
</template>

<script setup lang="ts">
import Conversation from "@/components/Conversation.vue";
import Sidebar from "@/components/Sidebar.vue";
import { useConversationStore } from "@/stores/conversations.ts";
import { useModelStore } from "@/stores/models.ts";

await useConversationStore().$fetch();
await useModelStore().$fetch();
</script>