<template>
  <PopoverRoot>
    <PopoverTrigger
      class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold hover:bg-gray-200/5"
    >
      {{ modelFullName(selected) }}
      <ChevronUp class="h-4 w-4" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        class="z-[999999] rounded-md border border-[#E2ECF5] bg-[#E2ECF5] p-1 text-[#333333] shadow-md dark:border-[#352635] dark:bg-[#352635] dark:text-white"
        align="start"
        :side-offset="5"
      >
        <div class="flex flex-col">
          <button
            v-for="model in availableModels"
            :key="model"
            class="flex w-full items-center justify-between rounded-sm px-4 py-3 text-left text-sm font-semibold transition hover:bg-gray-200/5"
            @click="selected = model"
          >
            <div class="flex items-center gap-2">
              <component
                :is="icons[models[model].icon]"
                class="h-4 w-4 text-[#55CDFC] dark:text-[#F7A8B8]"
              />
              {{ modelFullName(model) }}
            </div>
            <div class="flex items-center"></div>
          </button>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
import { icons } from '@/lib/icons';
import { modelFullName } from '@/lib/utils';
import { useModelStore } from '@/stores/models';
import { models, type Model } from 'common';
import { ChevronUp } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'radix-vue';

const selected = defineModel<typeof Model.infer>({ required: true });

const modelStore = useModelStore();
const { models: availableModels } = storeToRefs(modelStore);
</script>
