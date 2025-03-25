<template>
  <div id="model-selector">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-4 opacity-0"
    >
      <div
        v-if="expanded"
        class="absolute z-50 bg-vue-black-mute/5 dark:bg-vue-black-tooltip backdrop-blur-md border-2 border-vue-black-mute/5 dark:border-none shadow-lg rounded-lg w-full max-w-96 bottom-12 p-1 flex flex-col space-y-2"
      >
        <div
          v-for="model in models"
          @click="selectOption(model)"
          class="select-none cursor-pointer flex justify-between px-1 items-center"
        >
          <div class="flex space-x-1 items-center">
            <p class="font-medium">{{ modelInfo[model].name }}</p>
            <InfoIcon
              class="h-4 w-4 cursor-default"
              v-if="modelInfo[model].description"
              v-tooltip="{
                content: `<div class=&quot;break-words&quot;>${modelInfo[model].description!.replace(/(?<=\.) (?=[A-Z])/g, '<br>')}</div>`,
                html: true
              }"
            />
          </div>
          <div class="flex space-x-2">
            <component
              v-for="capability in modelInfo[model].capabilities"
              :is="capabilities[capability][0]"
              v-tooltip="capabilities[capability][1]"
            />
          </div>
        </div>
      </div>
    </Transition>
    <div class="flex items-center space-x-2 cursor-pointer select-none" @click="toggleExpanded">
      <p>{{ modelInfo[selected].name }}</p>
      <ChevronUpIcon
        :data-expanded="expanded"
        class="h-4 w-4 data-[expanded=true]:rotate-180 transition-all duration-300 ease-out"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, type DefineComponent } from 'vue';
import { modelInfo, type ModelInfo } from '../../shared/constants.ts';
import type { Model } from '../../shared';
import { useModelStore } from '@/stores/models.ts';
import { storeToRefs } from 'pinia';
import { ChevronUpIcon, InfoIcon } from 'lucide-vue-next';
import ImageInput from '@/components/model-capabilities/image-input.vue';
import ToolUsage from '@/components/model-capabilities/tool-usage.vue';
import Reasoning from '@/components/model-capabilities/reasoning.vue';

type CapabilityRecord = Record<
  ModelInfo['capabilities'][number],
  [DefineComponent<any, any, any, any, any, any, any, any, any, any>, string]
>;

const capabilities: CapabilityRecord = {
  imageInput: [ImageInput, 'Supports image uploads and analysis'],
  toolUsage: [ToolUsage, 'Can use tools'],
  reasoning: [Reasoning, 'Has reasoning capabilities']
};

const modelStore = useModelStore();
const { models } = storeToRefs(modelStore);

const expanded = ref<boolean>(false);
const selected = defineModel<Model>({ required: true });

function toggleExpanded() {
  expanded.value = !expanded.value;
}

function selectOption(value: Model) {
  selected.value = value;
  expanded.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (!expanded.value) return;
  const menu = document.querySelector('#model-selector');
  if (menu && !menu.contains(event.target as Node)) {
    expanded.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
