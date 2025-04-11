<template>
  <div
    :data-expanded="isExpanded"
    class="flex flex-col bg-gradient-to-b from-gray-300/5 via-gray-300/[2%] to-gray-300/5 dark:bg-none dark:bg-[#0A0A14] backdrop-blur-md transition-all duration-100 ease-out w-0 shadow-sm data-[expanded=true]:w-64 light:data-[expanded=true]:rounded-r-xl text-white/75 dark:text-white h-screen z-[99999999999] max-lg:fixed dark:border-r border-[#4E42A9]/50"
  >
    <div class="flex flex-col h-full w-64 p-1">
      <div class="flex flex-row relative p-1 w-fit flex-shrink-0">
        <button @click="toggleSidebar" class="p-2 hover:bg-gray-300/10 rounded-md z-20">
          <SidebarIcon class="w-4 h-4" />
        </button>
        <div
          :data-expanded="isExpanded"
          class="flex flex-row transition-all data-[expanded=true]:-translate-x-full data-[expanded=true]:pointer-events-none data-[expanded=true]:opacity-0 data-[expanded=false]:delay-100"
        >
          <button @click="'TODO'" class="p-2 hover:bg-gray-300/10 rounded-md z-20">
            <SearchIcon class="w-4 h-4" />
          </button>
          <RouterLink class="p-2 hover:bg-gray-300/10 rounded-md" to="/c/new">
            <PlusIcon class="w-4 h-4" />
          </RouterLink>
        </div>
      </div>

      <div
        :data-expanded="isExpanded"
        class="flex flex-col p-1 space-y-3 flex-grow transition-transform duration-100 ease-out data-[expanded=false]:-translate-x-full overflow-hidden"
      >
        <RouterLink
          class="bg-gradient-to-b from-[#4E42A9] to-[#322B85] hover:from-[#5B4DC7] hover:to-[#3D349E] py-1.5 rounded-md text-sm font-semibold text-center block border border-[#6D62DC]/50 flex-shrink-0"
          to="/c/new"
          :tabindex="isExpanded ? 0 : -1"
        >
          New Chat
        </RouterLink>
        <div class="overflow-y-auto flex-grow min-h-0">
          <div v-for="group in keys(groups)" v-bind:key="group">
            <p class="text-xs text-[#B8B8D0] font-semibold mb-1" v-if="groups[group].length">
              {{ group }}
            </p>
            <RouterLink
              v-for="c in groups[group]"
              v-bind:key="c.id"
              :to="{ name: 'c', params: { id: c.id } }"
              class="flex flex-row items-center p-2 rounded-xl hover:bg-gray-300/10 text-sm"
            >
              <span class="block truncate" :title="c.name ?? undefined">{{
                c.name ?? 'Untitled'
              }}</span>
            </RouterLink>
          </div>
        </div>
        <div class="flex-shrink-0 flex">
          <RouterLink
            to="/login"
            class="w-full flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-300/10"
          >
            <LogInIcon class="w-4 h-4" />
            <p>Login</p>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConversationStore } from '@/stores/conversations.ts';
import { keys } from 'common/utils';
import { LogInIcon, PlusIcon, SearchIcon, SidebarIcon } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { computed, onMounted, onUnmounted, type Ref, ref } from 'vue';
import { RouterLink } from 'vue-router';

const isExpanded = ref(true);

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
    (acc, v) => {
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
