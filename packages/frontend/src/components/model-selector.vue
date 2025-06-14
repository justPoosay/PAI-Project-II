<template>
  <PopoverRoot v-model:open="isOpen">
    <PopoverTrigger
      class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold hover:bg-gray-200/5"
    >
      {{ modelFullName(selected) }}
      <ChevronUp class="size-4" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        class="text-primary bg-dialog border-border z-999999 flex flex-col rounded-md border p-1 shadow-lg"
        align="start"
        :side-offset="5"
      >
        <button
          v-for="model in fromLS('available-models')"
          :key="model"
          class="flex w-full items-center justify-between gap-10 rounded-md px-4 py-3 text-left text-sm font-bold transition hover:bg-black/5 dark:hover:bg-gray-200/5"
          @click="selectModel(model)"
        >
          <div class="flex items-center gap-3">
            <component :is="icons[models[model].icon]" class="text-accent size-4" />
            {{ modelFullName(model) }}
          </div>
          <div class="flex items-center gap-1.5 *:cursor-default">
            <component
              v-for="capability in (models[model] as ModelInfo).capabilities
                .filter((capability): capability is keyof typeof capabilities => {
                  return includes(keys(capabilities), capability);
                })
                .sort()"
              :key="capability"
              :is="capabilities[capability][0]"
              :title="capabilities[capability][1]"
            />
          </div>
        </button>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
import ImageInput from '@/components/model-capabilities/image-input.vue';
import Reasoning from '@/components/model-capabilities/reasoning.vue';
import { query } from '@/lib/api';
import { icons } from '@/lib/icons';
import { fromLS, toLS } from '@/lib/local';
import { modelFullName, selfOrFirst } from '@/lib/utils';
import { models, type Model, type ModelInfo } from 'common';
import { includes, keys } from 'common/utils';
import { ChevronUp } from 'lucide-vue-next';
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui';
import type { DefineComponent } from 'vue';
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const capabilities = Object.freeze({
  imageInput: [ImageInput, 'Supports image uploads and analysis'],
  reasoning: [Reasoning, 'Has reasoning capabilities']
} satisfies Partial<{
  [K in (typeof models)[keyof typeof models]['capabilities'][number]]: [
    DefineComponent<
      any, // eslint-disable-line @typescript-eslint/no-explicit-any
      any, // eslint-disable-line @typescript-eslint/no-explicit-any
      any // eslint-disable-line @typescript-eslint/no-explicit-any
    >,
    string
  ];
}>);

const selected = defineModel<Model>({ required: true });
const isOpen = ref(false);

function selectModel(model: Model) {
  selected.value = model;
  isOpen.value = false;
  toLS('default-model', model);

  const id = selfOrFirst(route.params['id']);
  if (id) {
    query('PATCH /chat/:id', { id, model });
  }
}
</script>
