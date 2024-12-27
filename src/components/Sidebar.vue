<template>
  <div
    :data-expanded="isExpanded"
    class="flex flex-col bg-gradient-to-b from-white/10 via-white/5 to-white/10 backdrop-blur-sm transition-all duration-300 ease-out w-16 shadow-sm data-[expanded=true]:w-64 data-[expanded=true]:rounded-r-xl text-white/75 h-screen"
  >
    <div class="p-1 flex flex-col h-full">
      <div class="flex justify-between items-center">
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
      <div class="w-full h-[2px] bg-white/15 mt-1" />
      <ul class="space-y-1 h-[calc(100vh-4rem)] overflow-y-auto pt-1">
        <li v-for="c in conversations" :key="c.id">
          <VMenu
            v-if="editingId !== c.id"
            placement="right"
          >
            <RouterLink
              :data-current="router.currentRoute.value.params.id === c.id"
              :to="`/c/${c.id}`"
              class="flex-grow block py-2 px-2 rounded transition from-white/15 to-white/15 data-[current=true]:shadow-md hover:bg-gradient-to-r overflow-hidden"
            >
              <span class="block truncate" :title="c.name ?? undefined">{{ c.name ?? "Untitled" }}</span>
            </RouterLink>

            <template #popper>
              <div class="flex p-2 text-white/75 space-x-2">
                <button title="delete" @click="deleteConversation(c.id)">
                  <Trash2Icon class="w-5 h-5"/>
                </button>
                <button title="rename" @click="startEdit(c)">
                  <Pencil class="w-5 h-5"/>
                </button>
              </div>
            </template>
          </VMenu>
          <input
            v-else
            v-model="editedName"
            @keydown.enter="saveEdit(c.id)"
            @keydown.esc="cancelEdit"
            @blur="cancelEdit"
            class="flex-grow block py-2 px-2 rounded bg-white/10 text-white focus:outline-none focus:ring-1 focus:ring-white/30 w-full"
            :ref="el => { if (el) (el as HTMLInputElement).focus() }"
          >
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { PlusIcon, ChevronLeftIcon, Trash2Icon, Pencil } from "lucide-vue-next";
import { useConversationStore } from "@/stores/conversations.ts";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";

const router = useRouter();
const isExpanded = ref(true);
const editingId = ref<string | null>(null);
const editedName = ref("");

const conversationStore = useConversationStore();
const { conversations } = storeToRefs(conversationStore);

onMounted(() => {
  conversationStore.$fetch();
});

function toggleSidebar() {
  isExpanded.value = !isExpanded.value;
}

function startEdit(conversation: { id: string; name: string | null }) {
  editingId.value = conversation.id;
  editedName.value = conversation.name ?? "";
}

async function saveEdit(id: string) {
  if(editedName.value.trim() !== "") {
    await conversationStore.$rename(id, editedName.value.trim());
    editingId.value = null;
  }
}

function cancelEdit() {
  editingId.value = null;
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