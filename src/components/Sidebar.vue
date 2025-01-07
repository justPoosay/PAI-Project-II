<template>
  <div
    :data-expanded="isExpanded"
    class="flex flex-col bg-gradient-to-b from-white/10 via-white/5 to-white/10 backdrop-blur-sm transition-all duration-300 ease-out w-16 max-lg:w-0 shadow-sm data-[expanded=true]:w-64 data-[expanded=true]:rounded-r-xl text-white/75 h-screen z-50 max-lg:fixed"
  >
    <div class="p-1 pb-3 flex flex-col h-full relative">
      <div
        :data-expanded="isExpanded"
        class="flex data-[expanded=false]:max-lg:flex-col-reverse justify-center data-[expanded=true]:justify-between lg:justify-between data-[expanded=true]:items-center data-[expanded=false]:max-lg:absolute data-[expanded=false]:max-lg:p-1 data-[expanded=false]:max-lg:bg-white/10 data-[expanded=false]:max-lg:backdrop-blur-sm data-[expanded=false]:max-lg:rounded-full"
      >
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
      <div :data-expanded="isExpanded" class="w-full h-[2px] bg-white/15 mt-1 data-[expanded=false]:max-lg:hidden"/>
      <ul class="space-y-1 h-[calc(100vh-4rem)] overflow-y-auto pt-1">
        <div v-for="[group, conversations] in Object.entries(groups).filter(v => v[1].length)">
          <li class="text-white/50 text-sm px-2 py-1" :key="group">{{ group }}</li>
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
        </div>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, type Ref, ref } from "vue";
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

type Conversations = typeof conversations extends Ref<infer U> ? U : never;

const groups = computed(function() {
  const groups = {
    "Today"(date) {
      const today = new Date();
      return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    },
    "Yesterday"(date) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
    },
    "Last Week"(date) {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      return date >= lastWeek;
    },
    "Older"(_) {
      return true;
    },
  } as const satisfies Record<string, (date: Date) => boolean>;

  return conversations.value.reduce(
    function(acc, v) {
      const group = Object.keys(groups).find(g => groups[g as keyof typeof groups](v.updated_at)) ?? "Older";
      acc[group as keyof typeof acc].push(v);
      return acc;
    },
    Object.fromEntries(
      Object.keys(groups).map(v => [v, [] as Conversations]),
    ) as Record<keyof typeof groups, Conversations>,
  );
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
    await conversationStore.$modify({ id, name: editedName.value.trim() });
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

function resizeHandler() {
  if(window.innerWidth < 1024 && isExpanded.value) {
    isExpanded.value = false;
  }
}

onMounted(function() {
  window.addEventListener("resize", resizeHandler);
  resizeHandler();
});

onUnmounted(function() {
  window.removeEventListener("resize", resizeHandler);
});
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