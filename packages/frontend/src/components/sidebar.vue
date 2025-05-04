<template>
  <nav
    :data-expanded="isExpanded"
    class="z-99999999999 flex h-screen w-0 animate-[rotate-gradient_5s_linear_infinite] flex-col border-transparent bg-clip-padding transition-all duration-100 ease-out [--bg:#DDE6F0] data-[expanded=false]:pointer-events-none data-[expanded=true]:w-64 max-lg:fixed max-lg:[background:linear-gradient(var(--bg),var(--bg))_padding-box,linear-gradient(var(--angle,225deg),#FF000E,#FF7300,#FAD220,#138F3E,#3558A0,#880082)_border-box] max-lg:data-[expanded=true]:border-r-2 max-lg:data-[expanded=true]:shadow-md dark:[--bg:#2A1F2A] dark:max-lg:data-[expanded=true]:border-r"
  >
    <div class="flex h-full w-64 flex-col p-1">
      <div class="relative flex w-fit shrink-0 flex-row p-1">
        <button
          @click="toggleSidebar"
          class="pointer-events-auto z-20 cursor-pointer rounded-md p-2 transition hover:bg-black/5 dark:hover:bg-gray-200/5"
        >
          <SidebarIcon class="size-4" />
        </button>
        <div
          :data-expanded="isExpanded"
          class="pointer-events-auto flex flex-row transition-all data-[expanded=false]:delay-100 data-[expanded=true]:pointer-events-none data-[expanded=true]:-translate-x-full data-[expanded=true]:opacity-0"
        >
          <button
            @click="'TODO'"
            class="z-20 cursor-pointer rounded-md p-2 transition hover:bg-black/5 dark:hover:bg-gray-200/5"
          >
            <SearchIcon class="size-4" />
          </button>
          <RouterLink
            class="rounded-md p-2 transition hover:bg-black/5 dark:hover:bg-gray-200/5"
            :to="{ name: 'chat', params: { id: 'new' } }"
          >
            <PlusIcon class="size-4" />
          </RouterLink>
        </div>
      </div>
      <div
        :data-expanded="isExpanded"
        class="flex grow flex-col space-y-1 overflow-hidden p-1 transition-transform duration-100 ease-out data-[expanded=false]:-translate-x-full"
      >
        <RouterLink
          class="block shrink-0 rounded-md border border-[#3EB0E2] bg-linear-to-r from-[#55CDFC] to-[#3EB0E2] py-1.5 text-center text-sm font-semibold transition hover:from-[#2A9FD8] hover:to-[#1E8BC4] dark:border-[#C3778C] dark:from-[#F7A8B8] dark:to-[#D08A9E] dark:hover:from-[#C3778C] dark:hover:to-[#A86479]"
          :to="{ name: 'chat', params: { id: 'new' } }"
          :tabindex="isExpanded ? 0 : -1"
        >
          New Chat
        </RouterLink>
        <div class="min-h-0 grow overflow-y-auto">
          <div v-if="state === 'idle'">
            <div v-for="group in keys(groups)" v-bind:key="group">
              <p
                class="text-xs font-semibold text-[#55CDFC] dark:text-[#F7A8B8]"
                v-if="groups[group].length"
              >
                {{ group }}
              </p>
              <RouterLink
                v-for="c in groups[group]"
                v-bind:key="String(c._id)"
                :to="{ name: 'chat', params: { id: String(c._id) } }"
                class="flex flex-row items-center rounded-xl p-2 text-sm transition hover:bg-black/5 dark:hover:bg-gray-200/5"
              >
                <span class="block truncate" :title="c.name ?? undefined">
                  {{ c.name ?? 'Untitled' }}
                </span>
              </RouterLink>
            </div>
          </div>
          <div v-else class="flex size-full items-center justify-center">
            <Loader v-if="state === 'loading'" />
            <div v-else class="text-center">
              <button @click="init" class="group text-sm font-semibold">
                <span class="block text-[#f82447] group-hover:hidden">Error</span>
                <span class="hidden text-[#55CDFC] group-hover:inline dark:text-[#F7A8B8]">
                  Retry
                </span>
              </button>
              <p class="text-xs">check the browser console for details</p>
            </div>
          </div>
        </div>
        <div class="flex shrink-0 pt-1">
          <RouterLink
            v-if="!session.data"
            :to="{ name: 'login' }"
            class="flex w-full items-center space-x-2 rounded-xl p-2 hover:bg-black/5 dark:hover:bg-gray-200/5"
          >
            <LogInIcon class="size-4" />
            <p>Login</p>
          </RouterLink>
          <RouterLink
            v-else
            class="flex w-full items-center space-x-2 rounded-xl p-2 hover:bg-black/5 dark:hover:bg-gray-200/5"
            :to="{ name: 'account-settings' }"
          >
            <AvatarRoot class="size-9 rounded-full bg-gray-300 select-none dark:bg-gray-700">
              <AvatarImage
                class="size-full rounded-[inherit] object-cover"
                :src="session.data.user.image ?? ''"
                :alt="session.data.user.name"
              />
              <AvatarFallback
                class="flex size-full items-center justify-center font-semibold text-emerald-500"
              >
                {{ session.data.user.name.charAt(0) || 'U' }}
              </AvatarFallback>
            </AvatarRoot>
            <div class="flex flex-col items-start">
              <p class="m-0 text-sm font-semibold">
                {{ session.data.user.name ?? 'User' }}
              </p>
              <p class="m-0 text-xs text-gray-500 dark:text-gray-400">
                {{ capitalize(tier) }}
              </p>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import Loader from '@/components/loader.vue';
import { useSession } from '@/lib/auth-client';
import { isTRPCClientError, trpc } from '@/lib/trpc';
import { capitalize } from '@/lib/utils';
import router from '@/router';
import { useConversationStore } from '@/stores/conversations.ts';
import { keys } from 'common/utils';
import { LogInIcon, PlusIcon, SearchIcon, SidebarIcon } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui';
import { computed, onMounted, onUnmounted, type Ref, ref } from 'vue';
import { RouterLink } from 'vue-router';

const session = useSession();

const isExpanded = defineModel<boolean>({ required: true });
const circumstances = ref<Partial<{ force: boolean; narrow: boolean }>>({});

const tier = ref<'free' | 'pro'>('free');

const state = ref<'idle' | 'loading' | 'error'>('loading');
const conversationStore = useConversationStore();
const refs = storeToRefs(conversationStore);
const conversations = computed(() => {
  return refs.conversations.value.filter(c => !c.deleted);
});

init();

function init() {
  state.value = 'loading';
  conversationStore
    .$fetch()
    .then(() => {
      state.value = 'idle';
    })
    .catch(e => {
      state.value = 'error';
      console.error(e);
      if (isTRPCClientError(e) && e.message === 'UNAUTHORIZED') {
        router.push({ name: 'login' });
      }
    });

  trpc.stripe.getLimits.query().then(data => {
    tier.value = data.tier;
  });
}

type Conversations = typeof conversations extends Ref<infer U> ? U : never;

const groups = computed(function () {
  const groups = Object.freeze({
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
  } satisfies Record<string, (date: Date) => boolean>);

  return conversations.value.reduce(
    (acc, v) => {
      if (!v.deleted) {
        const group =
          Object.keys(groups).find(g => groups[g as keyof typeof groups](v.updatedAt)) ?? 'Older';
        acc[group as keyof typeof acc].push(v);
      }
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
  circumstances.value = { force: false, narrow: window.innerWidth < 1024 };
}

function resizeHandler() {
  if (window.innerWidth < 1024 && isExpanded.value && !circumstances.value.narrow) {
    isExpanded.value = false;
    circumstances.value.force = true;
  } else if (window.innerWidth >= 1024) {
    if (circumstances.value.force) {
      isExpanded.value = true;
      circumstances.value.force = false;
    }
    circumstances.value.narrow = false;
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
