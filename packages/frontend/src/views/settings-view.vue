<template>
  <main
    class="flex size-full items-center justify-center bg-[#E7F0F8] text-[#333333] dark:bg-[#352A35] dark:text-white"
  >
    <div class="flex h-full flex-col space-y-7 p-3 text-sm transition-[padding] md:p-7">
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
        <div class="flex flex-col items-center space-y-4">
          <AvatarRoot class="size-40 rounded-full bg-gray-300 select-none dark:bg-gray-700">
            <AvatarImage
              class="size-full rounded-[inherit] object-cover"
              :src="session.data?.user.image ?? ''"
              :alt="session.data?.user.name"
            />
            <AvatarFallback
              class="flex size-full items-center justify-center text-6xl font-semibold text-[#3558A0]"
            >
              {{ session.data?.user.name.charAt(0) || 'U' }}
            </AvatarFallback>
          </AvatarRoot>
          <div class="flex flex-col items-center">
            <h1 class="text-2xl font-bold">{{ session.data?.user.name }}</h1>
            <p class="text-[#333333]/75 dark:text-white/75">{{ session.data?.user.email }}</p>
            <div class="rounded-full bg-[#3558A0] px-3 py-[1px] text-sm font-semibold text-white">
              {{ capitalize(limits.tier) }}
            </div>
          </div>
          <div
            class="flex flex-col space-y-6 rounded-lg bg-[#DDE6F0] p-3 text-sm shadow-md dark:bg-[#2A1F2A]"
          >
            <div class="flex flex-row items-center justify-between gap-8">
              <p class="font-bold">Message Usage</p>
              <p class="text-[#333333]/75 dark:text-white/75">
                Resets {{ dayjs(limits.refresh).format('MMMM D, YYYY') }}
              </p>
            </div>
            <div class="flex flex-col space-y-1">
              <div class="flex flex-row items-center justify-between gap-8">
                <p class="font-semibold">Standard</p>
                <p class="text-[#333333]/75 dark:text-white/75">
                  {{ limits.messagesUsed }}/{{ messagesPerMonth[limits.tier] }}
                </p>
              </div>
              <div class="h-2 w-full rounded-full bg-[#E7F0F8] dark:bg-[#352A35]">
                <div
                  class="h-full rounded-full bg-[#3558A0]"
                  :style="{
                    width: `${Math.min((limits.messagesUsed / messagesPerMonth[limits.tier]) * 100, 100)}%`
                  }"
                />
              </div>
              <p class="text-[#333333]/75 dark:text-white/75">
                {{ messagesPerMonth[limits.tier] - limits.messagesUsed }} messages remaining
              </p>
            </div>
          </div>
        </div>
        <router-view />
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
import dayjs from 'dayjs';
import { ArrowLeft } from 'lucide-vue-next';
import { AvatarFallback, AvatarImage, AvatarRoot } from 'radix-vue';
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

const session = useSession();

const limits = ref<ART<typeof trpc.stripe.getLimits.query>>(fromLS('limits'));

trpc.stripe.getLimits.query().then(data => {
  limits.value = data;
  toLS('limits', data);
}, console.error);
</script>
