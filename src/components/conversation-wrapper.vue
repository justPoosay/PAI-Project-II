<template>
  <Sidebar/>
  <Conversation/>
</template>

<script setup lang="ts">
import Conversation from "@/components/conversation.vue";
import Sidebar from "@/components/sidebar.vue";
import { useConversationStore } from "@/stores/conversations.ts";
import { useModelStore } from "@/stores/models.ts";

await useConversationStore().$fetch();
await useModelStore().$fetch();
</script>