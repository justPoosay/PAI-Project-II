<template>
  <main
    class="bg-bg-light text-text-primary-light dark:bg-bg-dark dark:text-text-primary-dark flex size-full items-center justify-center"
  >
    <div class="flex h-full flex-col gap-7 p-3 text-sm transition-[padding] md:p-7">
      <div class="flex items-center justify-between">
        <RouterLink
          :to="{ name: 'chat', params: { id: 'new' } }"
          class="flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold transition hover:bg-black/5 dark:hover:bg-gray-200/5"
        >
          <ArrowLeft class="size-4" />
          Back to Chat
        </RouterLink>
        <div class="flex items-center gap-2">
          <ThemeToggle />
          <button
            @click="
              signOut({
                fetchOptions: {
                  onSuccess() {
                    router.push({
                      name: 'home'
                    });
                  }
                }
              })
            "
            class="flex cursor-pointer rounded-lg px-4 py-2 font-semibold transition hover:bg-black/5 dark:hover:bg-gray-200/5"
          >
            Sign Out
          </button>
        </div>
      </div>
      <div class="flex flex-col gap-8 lg:flex-row">
        <div class="flex flex-col items-center gap-4">
          <AvatarRoot class="size-40 rounded-full bg-gray-300 select-none dark:bg-gray-700">
            <AvatarImage
              class="size-full rounded-[inherit] object-cover"
              :src="session.data?.user.image ?? ''"
              :alt="session.data?.user.name"
            />
            <AvatarFallback
              class="text-purple flex size-full items-center justify-center text-6xl font-semibold"
            >
              {{ session.data?.user.name.charAt(0) || 'U' }}
            </AvatarFallback>
          </AvatarRoot>
          <div class="flex flex-col items-center">
            <h1 class="-mb-1 text-2xl font-bold">{{ session.data?.user.name }}</h1>
            <p class="text-text-secondary-light dark:text-text-secondary-dark">
              {{ session.data?.user.email }}
            </p>
            <div class="bg-pink-2 rounded-full px-3 py-[1px] text-sm font-semibold text-white">
              {{ capitalize(limits.tier) }}
            </div>
          </div>
          <div
            class="bg-sidebar-light dark:bg-sidebar-dark flex flex-col gap-6 rounded-lg p-3 text-sm shadow-md"
          >
            <div class="flex flex-row items-center justify-between gap-8">
              <p class="font-bold">Message Usage</p>
              <p class="text-text-secondary-light dark:text-text-secondary-dark">
                Resets {{ dayjs(limits.refresh).format('MMMM D, YYYY') }}
              </p>
            </div>
            <div class="flex flex-col gap-1">
              <div class="flex flex-row items-center justify-between gap-8">
                <p class="font-semibold">Standard</p>
                <p class="text-text-secondary-light dark:text-text-secondary-dark">
                  {{ limits.messagesUsed }}/{{ messagesPerMonth[limits.tier] }}
                </p>
              </div>
              <div class="bg-bg-light dark:bg-bg-dark h-2 w-full rounded-full">
                <span
                  class="bg-pink-2 block h-full rounded-full"
                  :style="{
                    width: `${Math.min((limits.messagesUsed / messagesPerMonth[limits.tier]) * 100, 100)}%`
                  }"
                />
              </div>
              <p class="text-text-secondary-light dark:text-text-secondary-dark">
                {{ messagesPerMonth[limits.tier] - limits.messagesUsed }} messages remaining
              </p>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-4">
          <nav
            class="flex flex-row items-center gap-1 self-start rounded-lg bg-gray-200 p-1 dark:bg-gray-700"
          >
            <RouterLink
              v-for="[route, name] in entries(routes)"
              :key="route"
              :to="{ name: route }"
              class="aria-[current=page]:bg-bg-light dark:aria-[current=page]:bg-bg-dark rounded-md px-3 py-1 font-bold transition hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {{ name }}
            </RouterLink>
          </nav>
          <router-view />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import ThemeToggle from '@/components/theme-toggle.vue';
import { signOut, useSession } from '@/lib/auth-client';
import { messagesPerMonth } from '@/lib/constants';
import { fromLS, toLS } from '@/lib/local';
import { trpc } from '@/lib/trpc';
import type { ART } from '@/lib/types';
import { capitalize } from '@/lib/utils';
import router from '@/router';
import { entries } from 'common/utils';
import dayjs from 'dayjs';
import { ArrowLeft } from 'lucide-vue-next';
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui';
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

const session = useSession();

const limits = ref<ART<typeof trpc.stripe.getLimits.query>>(fromLS('limits'));

trpc.stripe.getLimits.query().then(data => {
  limits.value = data;
  toLS('limits', data);
}, console.error);

const routes = {
  'account-settings': 'Account'
} satisfies Record<string, string>;
</script>
