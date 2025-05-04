<template>
  <div class="flex flex-col gap-16">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
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
          <div class="gap-1">
            <div class="flex items-center gap-1">
              <RocketIcon class="size-5 text-[#3558A0]" />
              <h1 class="text-base font-bold">All AI Models</h1>
            </div>
            <p class="text-sm text-[#333333]/75 dark:text-white/75">
              Get access to our full suite of models including Claude, o4-mini-high, and more!
            </p>
          </div>
          <div class="gap-1">
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
        class="cursor-pointer self-start rounded-lg bg-[#3558A0] px-16 py-2 font-semibold text-white transition hover:bg-[#6e9eff]"
        @click="handleSubButton"
      >
        {{ limits.tier === 'pro' ? 'Manage Subscription' : 'Upgrade Now' }}
      </button>
    </div>
    <div class="flex flex-col gap-4">
      <h1 class="text-3xl font-bold">Danger Zone</h1>
      <p class="text-sm text-[#333333]/75 dark:text-white/75">
        Permanently delete your account and all associated data.
      </p>
      <DialogRoot>
        <DialogTrigger
          class="cursor-pointer self-start rounded-lg border border-red-500/25 bg-red-500/25 px-4 py-2 font-semibold text-white transition hover:bg-red-500"
        >
          Delete Account
        </DialogTrigger>
        <DialogPortal>
          <DialogOverlay class="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" />
          <DialogContent
            class="fixed top-[50%] left-[50%] z-99 flex translate-x-[-50%] translate-y-[-50%] flex-col gap-4 rounded-md bg-[#E7F0F8] p-2 text-[#333333] dark:bg-[#352A35] dark:text-white"
          >
            <div>
              <DialogTitle class="text-xl font-semibold">
                Are you sure you want to delete your account?
              </DialogTitle>
              <DialogDescription class="text-sm text-[#333333]/75 dark:text-white/75">
                This action cannot be undone. All your data will be permanently deleted.
              </DialogDescription>
            </div>
            <div class="flex flex-row gap-2">
              <button
                class="cursor-pointer rounded-lg border border-red-500/25 bg-red-500/25 px-3 py-1 font-semibold text-white transition hover:bg-red-500"
                @click="
                  deleteUser({
                    fetchOptions: {
                      onSuccess() {
                        router.push({
                          name: 'home'
                        });
                      }
                    }
                  })
                "
              >
                Delete Account
              </button>
              <DialogClose
                class="cursor-pointer rounded-lg border border-[#3558A0]/25 bg-[#3558A0]/25 px-3 py-1 font-semibold text-white transition hover:bg-[#3558A0]"
              >
                Cancel
              </DialogClose>
            </div>
          </DialogContent>
        </DialogPortal>
      </DialogRoot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { deleteUser } from '@/lib/auth-client';
import { messagesPerMonth } from '@/lib/constants';
import { fromLS, toLS } from '@/lib/local';
import { trpc } from '@/lib/trpc';
import type { ART } from '@/lib/types';
import router from '@/router';
import { RocketIcon, SparklesIcon } from 'lucide-vue-next';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger
} from 'reka-ui';
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
