<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useChatStore } from "@/stores/chats.ts";
import { storeToRefs } from "pinia";

const chatStore = useChatStore();
const { chats } = storeToRefs(chatStore);

onMounted(() => {
  chatStore.$fetch();
});

let open = ref(false);
</script>

<template>
  <div role="complementary" class="h-full bg-vue-black shadow-md w-max max-w-[10vw]" :data-open="open">
    <div class="flex flex-col p-2">
      <RouterLink class="text-vue-white" v-for="{ name, id } in chats" :to="`/chat/${id}`">
        {{ name || "Untitled" }}
      </RouterLink>
    </div>
  </div>
</template>