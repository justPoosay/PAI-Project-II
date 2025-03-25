import { isBackendAlive } from '@/lib/utils.ts';
import { defineStore } from 'pinia';
import { type Model, routes } from 'shared';
import { ref } from 'vue';

export const useModelStore = defineStore('models', () => {
  const models = ref<Model[]>([]);
  const error = ref<string | null>();

  async function $fetch() {
    try {
      const res = await fetch('/api/models');
      if (!res.ok) {
        const alive = await isBackendAlive();
        if (!alive) throw new Error('Backend seems to be dead');
        throw new Error(res.statusText);
      }
      const result = routes['models'].safeParse(await res.json());
      if (!result.success) throw new Error('Backend provided bogus data');
      models.value = result.data;
      error.value = null;
    } catch (e) {
      if (e instanceof Error) {
        error.value = e.message;
      }
    }
  }

  return {
    models,
    $fetch,
    error
  };
});
