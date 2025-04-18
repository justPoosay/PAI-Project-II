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
        class="z-[999999] flex min-w-28 flex-col rounded-md border border-[#c0e1fd] bg-[#E2ECF5] p-1 text-[#333333] shadow-lg dark:border-[#615261] dark:bg-[#352635] dark:text-white"
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
import { Effort } from 'common';
import { keys } from 'common/utils';
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'radix-vue';
import { ref } from 'vue';

const efforts = Object.freeze({
  high: null,
  medium: null,
  low: null
} satisfies { [K in typeof Effort.infer]: unknown });

const isOpen = ref(false);

const effort = defineModel<typeof Effort.infer>({ required: true });

function selectEffort(e: typeof Effort.infer) {
  effort.value = e;
  isOpen.value = false;
}
</script>
