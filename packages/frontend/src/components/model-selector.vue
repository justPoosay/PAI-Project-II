<template>
  <PopoverRoot v-model:open="isOpen">
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
            class="flex w-full items-center justify-between gap-10 rounded-md px-4 py-3 text-left text-sm font-bold transition hover:bg-gray-200/5"
            @click="selectModel(model)"
          >
            <div class="flex items-center gap-2">
              <component
                :is="icons[models[model].icon]"
                class="h-4 w-4 text-[#55CDFC] dark:text-[#F7A8B8]"
              />
              {{ modelFullName(model) }}
            </div>
            <div class="flex items-center space-x-1.5">
              <component
                v-for="capability in models[model].capabilities"
                :key="capability"
                :is="capabilities[capability][0]"
                :title="capabilities[capability][1]"
              />
            </div>
          </button>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
import ImageInput from '@/components/model-capabilities/image-input.vue';
import Reasoning from '@/components/model-capabilities/reasoning.vue';
import ToolUsage from '@/components/model-capabilities/tool-usage.vue';
import { icons } from '@/lib/icons';
import { modelFullName } from '@/lib/utils';
import { useModelStore } from '@/stores/models';
import { models, type Model } from 'common';
import { ChevronUp } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'radix-vue';
import type { DefineComponent } from 'vue';
import { ref } from 'vue';

const capabilities = Object.freeze({
  imageInput: [ImageInput, 'Supports image uploads and analysis'],
  reasoning: [Reasoning, 'Has reasoning capabilities'],
  toolUsage: [ToolUsage, 'Can use external tools']
} satisfies {
  [K in (typeof models)[keyof typeof models]['capabilities'][number]]: [
    DefineComponent<
      any, // eslint-disable-line @typescript-eslint/no-explicit-any
      any, // eslint-disable-line @typescript-eslint/no-explicit-any
      any // eslint-disable-line @typescript-eslint/no-explicit-any
    >,
    string
  ];
});

const selected = defineModel<typeof Model.infer>({ required: true });

const modelStore = useModelStore();
const { models: availableModels } = storeToRefs(modelStore);

const isOpen = ref(false);

function selectModel(modelName: typeof Model.infer) {
  selected.value = modelName;
  isOpen.value = false;
}
</script>
