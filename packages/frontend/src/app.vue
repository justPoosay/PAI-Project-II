<template>
  <RouterView v-if="loaded" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RouterView } from 'vue-router';
import { query } from './lib/api';
import { fromLS, fromLSSafe, toLS } from './lib/local';
import { setTheme } from './lib/utils';

if (!fromLSSafe('user-preferences')) {
  toLS('user-preferences', {
    name: '',
    occupation: '',
    selectedTraits: '',
    additionalInfo: ''
  });
}

if (!fromLSSafe('theme')) {
  toLS('theme', 'system');
}

setTheme(fromLS('theme'));

// Preloading some data into localStorage to avoid loading screens or flickering later on

const loaded = ref(false);

if (!fromLSSafe('default-reasoning-effort')) {
  toLS('default-reasoning-effort', 'low');
}

Promise.all([
  query('GET /model/available').then(v => {
    if (v.isOk()) {
      toLS('available-models', v.value);
      const defaultModel = fromLSSafe('default-model');
      if (!defaultModel || !v.value.includes(defaultModel)) {
        toLS('default-model', v.value[0]!);
      }
    } else {
      console.error('Failed to fetch available models:', v.error);
      throw v.error;
    }
  }),
  query('GET /stripe/price').then(v => {
    if (v.isOk()) {
      toLS('price', v.value);
    } else {
      console.error('Failed to fetch price:', v.error);
      throw v.error;
    }
  }),
  query('GET /stripe/limits').then(v => {
    if (v.isOk()) {
      toLS('limits', v.value);
    } else {
      console.error('Failed to fetch limits:', v.error);
      throw v.error;
    }
  })
]).then(() => {
  loaded.value = true;
}, console.error);
</script>
