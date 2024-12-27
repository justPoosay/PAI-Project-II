import { defineStore } from "pinia";
import type { Model } from "../../shared";
import { ref } from "vue";
import { routes } from "../../shared/schemas.ts";
import { modelArray } from "../../shared/constants.ts";

export const useModelStore = defineStore("models", () => {
  const models = ref<Model[]>(modelArray); // default to the static array
  
  async function $fetch() {
    try {
      const res = await fetch("/api/models");
      if(!res.ok) throw new Error("Failed to fetch models");
      const result = routes["models"].safeParse(await res.json());
      if(!result.success) throw new Error("Backend provided bogus data");
      models.value = result.data;
    } catch(e) {
      console.error(e);
    }
  }
  
  return {
    models,
    $fetch
  };
});