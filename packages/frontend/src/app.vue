<template>
  <RouterView v-if="loaded" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RouterView } from 'vue-router';
import { fromLS, fromLSSafe, toLS } from './lib/local';
import { trpc } from './lib/trpc';
import { setTheme } from './lib/utils';

if (!fromLSSafe('theme')) {
  toLS('theme', 'system');
}

setTheme(fromLS('theme'));

// Preloading some data into localStorage to avoid loading screens or flickering later on

const loaded = ref(false);

if (!fromLSSafe('defaultReasoningEffort')) {
  toLS('defaultReasoningEffort', 'low');
}

Promise.all([
  trpc.model.available.query().then(v => {
    toLS('availableModels', v);
    const defaultModel = fromLSSafe('defaultModel');
    if (!defaultModel || !v.includes(defaultModel)) {
      toLS('defaultModel', v[0]!);
    }
  }, console.error),
  trpc.stripe.getPrice.query().then(v => toLS('price', v), console.error),
  trpc.stripe.getLimits.query().then(v => toLS('limits', v), console.error)
]).then(() => {
  loaded.value = true;
});
</script>
