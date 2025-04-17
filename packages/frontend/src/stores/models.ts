import { trpc } from '@/lib/trpc';
import { Model } from 'common';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useModelStore = defineStore('models', () => {
  const models = ref<(typeof Model.infer)[]>([]);

  async function $fetch() {
    models.value = await trpc.models.query();
  }

  return {
    models,
    $fetch
  };
});
