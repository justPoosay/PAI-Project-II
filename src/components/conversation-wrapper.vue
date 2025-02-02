<template>
  <Sidebar v-model="showSettingModal" />
  <Conversation />
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[66] flex justify-center items-center"
    v-if="showSettingModal" />
  <Transition>
    <div v-if="showSettingModal" class="fixed left-[50%] top-[50%] z-[99] border border-[#7F7669] bg-[#141516] p-3 rounded-lg">
      <div>
        
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import Conversation from "@/components/conversation.vue";
import Sidebar from "@/components/sidebar.vue";
import { useConversationStore } from "@/stores/conversations.ts";
import { useModelStore } from "@/stores/models.ts";
import { ref } from "vue";

const showSettingModal = ref(false);

await useConversationStore().$fetch();
await useModelStore().$fetch();
</script>