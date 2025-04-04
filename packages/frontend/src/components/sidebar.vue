<template>
  <div
    :data-expanded="isExpanded"
    class="top-0 left-0 flex flex-col bg-gradient-to-b from-gray-300/5 via-gray-300/[2%] to-gray-300/5 dark:bg-none dark:bg-vue-black-darker backdrop-blur-md transition-all duration-100 ease-out w-0 shadow-sm data-[expanded=true]:w-64 light:data-[expanded=true]:rounded-r-xl text-white/75 dark:text-white h-screen z-[99999999999] max-lg:fixed"
  >
    <div class="flex flex-col h-full w-64">
      <div class="flex flex-row items-start relative p-1">
        <button @click="toggleSidebar" class="p-2 hover:bg-gray-300/10 rounded-md">
          <SidebarIcon class="w-4 h-4" />
        </button>
      </div>

      <div
        :data-expanded="isExpanded"
        class="flex flex-col p-1 space-y-3 flex-grow transition-transform duration-100 ease-out data-[expanded=false]:-translate-x-full"
      >
        <RouterLink
          class="bg-gradient-to-br from-green-500 to-emerald-500 py-1 rounded-md text-sm font-semibold text-center block"
          to="/c/new"
          :tabindex="isExpanded ? 0 : -1"
        >
          New Chat
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { trpc } from '@/lib/trpc';
import { useConversationStore } from '@/stores/conversations.ts';
import { SidebarIcon } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { computed, onMounted, onUnmounted, type Ref, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

const router = useRouter();
const isExpanded = ref(true);
const editingId = ref<string | null>(null);
const editedName = ref('');

const conversationStore = useConversationStore();
const { conversations } = storeToRefs(conversationStore);

type Conversations = typeof conversations extends Ref<infer U> ? U : never;

const groups = computed(function () {
  const groups = {
    Today(date) {
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    },
    Yesterday(date) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
      );
    },
    'Last Week'(date) {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      return date >= lastWeek;
    },
    Older() {
      return true;
    }
  } as const satisfies Record<string, (date: Date) => boolean>;

  return conversations.value.reduce(
    function (acc, v) {
      const group =
        Object.keys(groups).find(g => groups[g as keyof typeof groups](v.updated_at)) ?? 'Older';
      acc[group as keyof typeof acc].push(v);
      return acc;
    },
    Object.fromEntries(Object.keys(groups).map(v => [v, [] as Conversations])) as Record<
      keyof typeof groups,
      Conversations
    >
  );
});

function toggleSidebar() {
  isExpanded.value = !isExpanded.value;
}

function startEdit(conversation: { id: string; name: string | null }) {
  editingId.value = conversation.id;
  editedName.value = conversation.name ?? '';
}

async function saveEdit(id: string) {
  if (editedName.value.trim() !== '') {
    await conversationStore.$modify({ id, name: editedName.value.trim() });
    editingId.value = null;
  }
}

function cancelEdit() {
  editingId.value = null;
}

async function deleteConversation(id: string) {
  try {
    await trpc.conversation.delete.mutate({ id });
    conversationStore.conversations = conversationStore.conversations.filter(c => c.id !== id);
    if (router.currentRoute.value.params.id === id) {
      await router.push({ name: 'c', params: { id: 'new' } });
    }
  } catch (e) {
    // TODO
    console.error(e);
  }
}

function resizeHandler() {
  if (window.innerWidth < 1024 && isExpanded.value) {
    isExpanded.value = false;
  }
}

onMounted(function () {
  window.addEventListener('resize', resizeHandler);
  resizeHandler();
});

onUnmounted(function () {
  window.removeEventListener('resize', resizeHandler);
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
  @apply bg-white/15 dark:bg-vue-black-tooltip backdrop-blur-md border-none

.v-popper--theme-dropdown .v-popper__arrow-inner
  @apply hidden

.v-popper--theme-dropdown .v-popper__arrow-outer
  @apply border-white/15 dark:border-vue-black-tooltip
</style>
