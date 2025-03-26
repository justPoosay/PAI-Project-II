import { isBackendAlive } from '@/lib/utils.ts';
import { type } from 'arktype';
import { Model, routes } from 'common';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useModelStore = defineStore('models', () => {
  const models = ref<(typeof Model.infer)[]>([]);
  const error = ref<string | null>();

  async function $fetch() {
    try {
      const res = await fetch('/api/models');
      if (!res.ok) {
        const alive = await isBackendAlive();
        if (!alive) throw new Error('Backend seems to be dead');
        throw new Error(res.statusText);
      }
      const out = routes['models'](await res.json());
      if (out instanceof type.errors) throw new Error('Backend provided bogus data');
      models.value = out;
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
