<template>
  <Sidebar v-model="showSettingModal" />
  <Conversation />
  <SettingModal v-model="showSettingModal" />
</template>

<script setup lang="ts">
import Conversation from '@/components/conversation-main.vue';
import Sidebar from '@/components/sidebar.vue';
import SettingModal from '@/components/setting-modal.vue';
import { useConversationStore } from '@/stores/conversations.ts';
import { useModelStore } from '@/stores/models.ts';
import { ref } from 'vue';
import { usePreferenceStore } from '@/stores/preferences';

const showSettingModal = ref(false);

const preferenceStore = usePreferenceStore();
preferenceStore.load();

const conversationStore = useConversationStore();
await conversationStore.$fetch();

const modelStore = useModelStore();
await modelStore.$fetch();
</script>
