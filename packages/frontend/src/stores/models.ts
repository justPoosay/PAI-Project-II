import { trpc } from '@/lib/trpc';
import { Model } from 'common';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useModelStore = defineStore('models', () => {
  const models = ref<(typeof Model.infer)[]>([]);
  const error = ref<string | null>();

  async function $fetch() {
    try {
      models.value = await trpc.models.query();
      error.value = null;
    } catch (e) {
      error.value = `${e}`;
    }
  }

  return {
    models,
    $fetch,
    error
  };
});
