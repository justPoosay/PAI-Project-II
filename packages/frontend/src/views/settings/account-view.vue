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
        <div class="flex flex-row gap-8 *:max-w-sm">
          <div class="gap-1">
            <div class="flex items-center gap-1">
              <RocketIcon class="text-accent size-5" />
              <h1 class="text-base font-bold">All AI Models</h1>
            </div>
            <p class="text-muted text-sm">
              Get access to our full suite of models including Claude, o4-mini-high, and more!
            </p>
          </div>
          <div class="gap-1">
            <div class="flex items-center gap-1">
              <SparklesIcon class="text-accent size-5" />
              <h1 class="text-base font-bold">Generous Message Limits</h1>
            </div>
            <p class="text-muted text-sm">
              Receive {{ messagesPerMonth.pro }} message credits per month
            </p>
          </div>
        </div>
      </div>
      <button
        class="from-btn-pri-start to-btn-pri-end hover:from-btn-pri-hover-start hover:to-btn-pri-hover-end active:from-btn-pri-act-start active:to-btn-pri-act-end cursor-pointer self-start rounded-lg bg-gradient-to-r px-16 py-2 font-semibold text-white transition"
        @click="handleSubButton"
      >
        {{ limits.tier === 'pro' ? 'Manage Subscription' : 'Upgrade Now' }}
      </button>
    </div>
    <div class="flex flex-col gap-4">
      <h1 class="text-3xl font-bold">Danger Zone</h1>
      <p class="text-muted text-sm">Permanently delete your account and all associated data.</p>
      <DialogRoot>
        <DialogTrigger
          class="border-danger/50 bg-danger/10 text-danger hover:bg-danger cursor-pointer self-start rounded-lg border px-4 py-2 font-semibold transition hover:text-white"
        >
          Delete Account
        </DialogTrigger>
        <DialogPortal>
          <DialogOverlay class="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" />
          <DialogContent
            class="bg-dialog text-primary fixed top-[50%] left-[50%] z-99 flex translate-x-[-50%] translate-y-[-50%] flex-col gap-4 rounded-md p-2"
          >
            <div>
              <DialogTitle class="text-xl font-semibold">
                Are you sure you want to delete your account?
              </DialogTitle>
              <DialogDescription class="text-muted text-sm">
                This action cannot be undone. All your data will be permanently deleted.
              </DialogDescription>
            </div>
            <div class="flex flex-row gap-2">
              <button
                class="border-danger/50 bg-danger/10 text-danger hover:bg-danger cursor-pointer self-start rounded-lg border px-2 py-1 font-semibold transition hover:text-white"
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
                class="cursor-pointer rounded-lg border border-[#3558A0]/25 bg-[#3558A0]/25 px-3 py-1 font-semibold transition hover:bg-[#3558A0]"
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
import { query, routes } from '@/lib/api';
import { deleteUser } from '@/lib/auth-client';
import { messagesPerMonth } from '@/lib/constants';
import { fromLS, toLS } from '@/lib/local';
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

const price = ref<(typeof routes)['GET /stripe/price']['o']['inferOut']>(fromLS('price'));
const limits = ref<(typeof routes)['GET /stripe/limits']['o']['inferOut']>(fromLS('limits'));

query('GET /stripe/limits').then(data => {
  if (data.isOk()) {
    limits.value = data.value;
    toLS('limits', data.value);
  } else {
    console.error('Failed to fetch limits:', data.error);
  }
});

query('GET /stripe/price').then(data => {
  if (data.isOk()) {
    price.value = data.value;
    toLS('price', data.value);
  } else {
    console.error('Failed to fetch price:', data.error);
  }
}, console.error);

async function handleSubButton() {
  const result =
    fromLS('limits').tier === 'pro'
      ? await query('GET /stripe/create-portal-session')
      : await query('GET /stripe/create-checkout-session');
  if (result.isOk()) {
    window.location.href = result.value.url;
  } else {
    console.error('Failed to create session:', result.error);
  }
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(price);
}
</script>
