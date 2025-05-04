<template>
  <div class="flex flex-col space-y-4">
    <div class="flex flex-col space-y-2">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold">
          {{ limits.tier === 'pro' ? 'Pro Plan Benefits' : 'Upgrade to Pro' }}
        </h1>
        <p v-if="limits.tier === 'free'">
          <span class="text-2xl font-bold">
            {{ formatPrice(price.unitAmount / 100, price.currency) }} </span
          >/{{ price.interval }}
        </p>
      </div>
      <div class="grid grid-cols-2 gap-8">
        <div class="space-y-1">
          <div class="flex items-center gap-1">
            <RocketIcon class="size-5 text-[#3558A0]" />
            <h1 class="text-base font-bold">All AI Models</h1>
          </div>
          <p class="text-sm text-[#333333]/75 dark:text-white/75">
            Get access to our full suite of models including Claude, o4-mini-high, and more!
          </p>
        </div>
        <div class="space-y-1">
          <div class="flex items-center gap-1">
            <SparklesIcon class="size-5 text-[#3558A0]" />
            <h1 class="text-base font-bold">All AI Models</h1>
          </div>
          <p class="text-sm text-[#333333]/75 dark:text-white/75">
            Receive {{ messagesPerMonth.pro }} message credits per month
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
</template>

<script setup lang="ts">
import { messagesPerMonth } from '@/lib/constants';
import { fromLS, toLS } from '@/lib/local';
import { trpc } from '@/lib/trpc';
import type { ART } from '@/lib/types';
import { RocketIcon, SparklesIcon } from 'lucide-vue-next';
import { ref } from 'vue';

const price = ref<ART<typeof trpc.stripe.getPrice.query>>(fromLS('price'));
const limits = ref<ART<typeof trpc.stripe.getLimits.query>>(fromLS('limits'));

trpc.stripe.getLimits.query().then(data => {
  limits.value = data;
  toLS('limits', data);
}, console.error);

trpc.stripe.getPrice.query().then(data => {
  price.value = data;
  toLS('price', data);
}, console.error);

async function handleSubButton() {
  const { url } =
    fromLS('limits').tier === 'pro'
      ? await trpc.stripe.createPortalSession.query()
      : await trpc.stripe.createCheckoutSession.query();
  location.href = url;
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(price);
}
</script>
