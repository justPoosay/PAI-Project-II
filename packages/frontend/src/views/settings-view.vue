<template>
  <main
    class="flex h-full w-full items-center justify-center bg-[#E7F0F8] text-[#333333] dark:bg-[#352A35] dark:text-white"
  >
    <div class="flex h-full flex-col space-y-7 p-7 text-sm">
      <div class="flex items-center justify-between">
        <RouterLink
          :to="{ name: 'chat', params: { id: 'new' } }"
          class="flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold transition hover:bg-black/5 dark:hover:bg-gray-200/5"
        >
          <ArrowLeft class="h-4 w-4" />
          Back to Chat
        </RouterLink>
        <button
          @click="
            signOut({
              fetchOptions: {
                onSuccess() {
                  router.push({ name: 'chat', params: { id: 'new' } });
                }
              }
            })
          "
          class="flex cursor-pointer rounded-lg px-4 py-2 font-semibold transition hover:bg-black/5 dark:hover:bg-gray-200/5"
        >
          Sign Out
        </button>
      </div>
      <div class="flex flex-row space-x-8">
        <div class="flex flex-col items-center space-y-4">
          <AvatarRoot class="h-40 w-40 rounded-full bg-gray-300 select-none dark:bg-gray-700">
            <AvatarImage
              class="h-full w-full rounded-[inherit] object-cover"
              :src="session.data?.user.image ?? ''"
              :alt="session.data?.user.name"
            />
            <AvatarFallback
              class="flex h-full w-full items-center justify-center font-semibold text-[#3558A0]"
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
            class="flex flex-col space-y-6 rounded-lg bg-[#DDE6F0] p-3 text-sm dark:bg-[#2A1F2A]"
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
        <div class="flex flex-col space-y-4">
          <div class="flex flex-col space-y-2">
            <h1 class="text-3xl font-bold">
              {{ limits.tier === 'pro' ? 'Pro Plan Benefits' : 'Upgrade to Pro' }}
            </h1>
            <div class="grid grid-cols-2 gap-8">
              <div class="space-y-1">
                <div class="flex items-center gap-1">
                  <RocketIcon class="h-5 w-5 text-[#3558A0]" />
                  <h1 class="text-base font-bold">All AI Models</h1>
                </div>
                <p class="text-sm text-[#333333]/75 dark:text-white/75">
                  Get access to our full suite of models including Claude, o4-mini-high, and more!
                </p>
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-1">
                  <SparklesIcon class="h-5 w-5 text-[#3558A0]" />
                  <h1 class="text-base font-bold">All AI Models</h1>
                </div>
                <p class="text-sm text-[#333333]/75 dark:text-white/75">
                  Receive 1500 message credits per month
                </p>
              </div>
            </div>
          </div>
          <button
            class="inline-block w-auto cursor-pointer self-start rounded-lg bg-[#3558A0] px-16 py-2 font-semibold text-white transition hover:bg-[#6e9eff]"
            @click="handleSubButton"
          >
            {{ limits.tier === 'pro' ? 'Manage Subscription' : 'Upgrade Now' }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { signOut, useSession } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc';
import type { UnRef } from '@/lib/types';
import { capitalize } from '@/lib/utils';
import router from '@/router';
import dayjs from 'dayjs';
import { ArrowLeft, RocketIcon, SparklesIcon } from 'lucide-vue-next';
import { AvatarFallback, AvatarImage, AvatarRoot } from 'radix-vue';
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

const session = useSession();

const state = ref<'idle' | 'loading' | 'error'>('loading');
const limits = ref<Awaited<ReturnType<typeof trpc.stripe.getLimits.query>>>({
  messagesUsed: 0,
  tier: 'free',
  refresh: dayjs().add(1, 'month').toDate()
});

getLimits();

function getLimits() {
  trpc.stripe.getLimits
    .query()
    .then(data => {
      limits.value = data;
      state.value = 'idle';
    })
    .catch(error => {
      console.error(error);
      state.value = 'error';
    });
}

async function handleSubButton() {
  const { url } =
    limits.value.tier === 'pro'
      ? await trpc.stripe.createPortalSession.query()
      : await trpc.stripe.createCheckoutSession.query();
  location.href = url;
}

const messagesPerMonth: Record<UnRef<typeof limits>['tier'], number> = {
  free: parseInt(import.meta.env['VITE_MESSAGES_PER_MONTH_FREE']),
  pro: parseInt(import.meta.env['VITE_MESSAGES_PER_MONTH_PAID'])
};
</script>
