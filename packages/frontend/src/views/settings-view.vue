<template>
  <main class="max-h-screen w-full overflow-y-auto">
    <div
      class="pt-safe-offset-6 mx-auto flex max-w-[1200px] flex-col overflow-y-auto px-4 pb-24 md:px-6 lg:px-8"
    >
      <header class="flex items-center justify-between pb-8">
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
      </header>
      <div class="flex grow flex-col gap-4 md:flex-row">
        <div class="hidden space-y-8 md:block md:w-1/4">
          <div class="text-center">
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
            <h1 class="mt-4 text-2xl font-bold">{{ session.data?.user.name }}</h1>
            <p class="text-muted break-all">
              {{ session.data?.user.email }}
            </p>
            <span
              class="bg-accent mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
            >
              {{ capitalize(limits.tier) }} Plan
            </span>
          </div>
          <div class="bg-sidebar space-y-6 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold">Message Usage</p>
              <p class="text-muted text-end text-xs">
                Resets {{ dayjs(limits.refresh).format('MMMM D, YYYY') }}
              </p>
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-medium">Standard</h3>
                <p class="text-muted text-sm">
                  {{ limits.messagesUsed }}/{{ messagesPerMonth[limits.tier] }}
                </p>
              </div>
              <div class="bg-background h-2 w-full overflow-hidden rounded-full">
                <div
                  class="bg-accent h-full rounded-full"
                  :style="{
                    width: `${(limits.messagesUsed / messagesPerMonth[limits.tier]) * 100}%`
                  }"
                />
              </div>
              <p class="text-muted text-sm">
                {{ messagesPerMonth[limits.tier] - limits.messagesUsed }} messages remaining
              </p>
            </div>
          </div>
        </div>
        <div class="space-y-6 md:w-3/4 md:pl-12">
          <nav
            class="bg-accent/50 border-accent/25 inline-flex flex-row items-center gap-1 self-start rounded-lg border p-1 dark:border-0 dark:bg-gray-700"
          >
            <RouterLink
              v-for="[route, name] in entries(routes)"
              :key="route"
              :to="{ name: route }"
              class="aria-[current=page]:bg-background hover:aria-[current=page]:bg-background light:aria-[current=page]:shadow-sm rounded-md px-2 py-1 text-sm font-semibold transition hover:bg-white/25 dark:hover:bg-gray-600"
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
  'account-settings': 'Account',
  'customization-settings': 'Customization'
} satisfies Record<string, string>;
</script>
