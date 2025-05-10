<template>
  <PopoverRoot v-model:open="isOpen">
    <PopoverTrigger
      class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold hover:bg-gray-200/5"
      v-tooltip="'Reasoning effort'"
    >
      {{ capitalize(selected) }}
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        class="text-primary bg-dialog border-border z-999999 flex flex-col rounded-md border p-1 shadow-lg"
        align="start"
        :side-offset="5"
      >
        <button
          v-for="effort in keys(efforts)"
          :key="effort"
          class="flex w-full items-center justify-between gap-10 rounded-md px-2.5 py-1.5 text-left text-sm font-bold transition hover:bg-black/5 dark:hover:bg-gray-200/5"
          @click="selectEffort(effort)"
        >
          {{ capitalize(effort) }}
        </button>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
import { toLS } from '@/lib/local';
import { trpc } from '@/lib/trpc';
import { capitalize, selfOrFirst } from '@/lib/utils';
import type { Effort } from 'common';
import { keys } from 'common/utils';
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui';
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const efforts = Object.freeze({
  high: null,
  medium: null,
  low: null
} satisfies { [K in Effort]: unknown });

const selected = defineModel<Effort>({ required: true });
const isOpen = ref(false);

function selectEffort(reasoningEffort: Effort) {
  selected.value = reasoningEffort;
  isOpen.value = false;
  toLS('default-reasoning-effort', reasoningEffort);

  const id = selfOrFirst(route.params['id']);
  if (id) {
    trpc.chat.modify.mutate({ id, reasoningEffort });
  }
}
</script>
