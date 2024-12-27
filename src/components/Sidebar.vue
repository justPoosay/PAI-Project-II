<template>
  <div
    :data-expanded="isExpanded"
    class="flex flex-col bg-gradient-to-b from-white/10 via-white/5 to-white/10 backdrop-blur-sm transition-all duration-300 ease-out w-16 shadow-sm data-[expanded=true]:w-64 data-[expanded=true]:rounded-r-xl text-white/75 h-screen"
  >
    <div class="p-2 flex flex-col h-full">
      <div class="flex justify-between items-center mb-4">
        <RouterLink
          to="/c/new"
          class="p-2 rounded-full hover:bg-white/5 transition"
          :title="isExpanded ? 'New Chat' : ''"
        >
          <PlusIcon class="w-5 h-5"/>
        </RouterLink>
        <button
          @click="toggleSidebar"
          class="p-2 rounded-full hover:bg-white/5 transition"
        >
          <ChevronLeftIcon
            :data-expanded="isExpanded"
            class="w-5 h-5 data-[expanded=true]: data-[expanded=false]:rotate-180 transition-all duration-300 ease-out"
          />
        </button>
      </div>
      <ul class="space-y-1 px-1 h-[calc(100vh-4rem)] overflow-y-auto">
        <li v-for="c in conversations" :key="c.id">
          <VMenu
            placement="right"
          >
            <RouterLink
              :to="`/c/${c.id}`"
              class="block py-2 px-2 rounded transition from-white/10 from-75% to-white/15 hover:bg-gradient-to-br overflow-hidden"
            >
              <span class="block truncate" :title="c.name ?? undefined">{{ c.name ?? "Untitled" }}</span>
            </RouterLink>

            <template #popper>
              <div class="flex p-2 text-white/75">
                <button title="delete" @click="deleteConversation(c.id)">
                  <Trash2Icon class="w-5 h-5"/>
                </button>
              </div>
            </template>
          </VMenu>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { PlusIcon, ChevronLeftIcon, Trash2Icon } from "lucide-vue-next";
import { useConversationStore } from "@/stores/conversations.ts";
import { storeToRefs } from "pinia";
import router from "@/router";

const isExpanded = ref(true);

const conversationStore = useConversationStore();
const { conversations } = storeToRefs(conversationStore);

onMounted(() => {
  conversationStore.$fetch();
});

function toggleSidebar() {
  isExpanded.value = !isExpanded.value;
}

async function deleteConversation(id: string) {
  try {
    const res = await fetch(`/api/${id}/modify`, { method: "DELETE" });
    if(!res.ok) throw new Error("Failed to delete conversation");
    conversationStore.conversations = conversationStore.conversations.filter(c => c.id !== id);
    if(router.currentRoute.value.params.id === id) {
      await router.push({ name: "c", params: { id: "new" } });
    }
  } catch(e) {
    // TODO
    console.error(e);
  }
}
</script>

<style lang="sass" scoped>
ul.overflow-y-auto
  -ms-overflow-style: none
  scrollbar-width: none

  &::-webkit-scrollbar
    display: none
</style>

<style lang="sass">
.v-popper--theme-dropdown .v-popper__inner
  @apply bg-white/15 backdrop-blur-md border-none

.v-popper--theme-dropdown .v-popper__arrow-inner
  @apply hidden

.v-popper--theme-dropdown .v-popper__arrow-outer
  @apply border-white/15
</style>