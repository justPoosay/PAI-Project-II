<template>
  <PopoverRoot v-model:open="isOpen">
    <PopoverTrigger
      class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold hover:bg-gray-200/5"
      title="Reasoning effort"
    >
      {{ capitalize(effort) }}
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        class="text-text-primary bg-dialog-bg border-border z-999999 flex flex-col rounded-md border p-1 shadow-lg"
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
import { capitalize } from '@/lib/utils';
import type { Effort } from 'common';
import { keys } from 'common/utils';
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui';
import { ref } from 'vue';

const efforts = Object.freeze({
  high: null,
  medium: null,
  low: null
} satisfies { [K in Effort]: unknown });

const isOpen = ref(false);

const effort = defineModel<Effort>({ required: true });

function selectEffort(e: Effort) {
  effort.value = e;
  isOpen.value = false;
}
</script>
