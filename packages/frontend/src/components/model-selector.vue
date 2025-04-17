<template>
  <PopoverRoot>
    <PopoverTrigger
      class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold hover:bg-gray-200/5"
    >
      {{ models[selected].name }}
      <ChevronUp class="h-4 w-4" />
    </PopoverTrigger>
  </PopoverRoot>
</template>

<script setup lang="ts">
import { useModelStore } from '@/stores/models';
import { Model, models } from 'common';
import { ChevronUp } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { PopoverRoot, PopoverTrigger } from 'radix-vue';

const selected = defineModel<typeof Model.infer>({ required: true });

const modelStore = useModelStore();
const { models: availableModels } = storeToRefs(modelStore);
</script>
