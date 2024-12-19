<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useChatStore } from "@/stores/chats.ts";
import { storeToRefs } from "pinia";

const chatStore = useChatStore();
const { chats } = storeToRefs(chatStore);

onMounted(() => {
  chatStore.$fetch();
  console.log(chats);
});

let open = ref(false);
</script>

<template>
  <div role="complementary" class="fixed h-full bg-vue-black shadow-md" :data-open="open">
    <div class="flex flex-col p-2">
      <RouterLink class="text-vue-white" v-for="{ name, id } in chats" :to="`/chat/${id}`">
        {{ name || "Untitled" }}
      </RouterLink>
    </div>
  </div>
</template>