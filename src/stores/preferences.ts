import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Preferences {
  name: string;
  systemPrompt: string;
}

export const usePreferenceStore = defineStore('preferences', () => {
  const preferences = ref<Partial<Preferences>>({});

  const keys: (keyof Preferences)[] = ['name', 'systemPrompt'];

  function load() {
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        preferences.value[key] = JSON.parse(value) as Preferences[typeof key];
      }
    });
  }

  function save() {
    keys.forEach(key => {
      const value = preferences.value[key];
      if (value) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    });
  }

  return {
    preferences,
    load,
    save
  };
});
