<template>
  <RouterView v-if="loaded" />
  <main
    v-else
    class="bg-bg-light dark:bg-bg-dark flex size-full items-center justify-center"
  ></main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RouterView } from 'vue-router';
import { fromLS, fromLSSafe, toLS } from './lib/local';
import { trpc } from './lib/trpc';
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
  trpc.model.available.query().then(v => {
    toLS('available-models', v);
    const defaultModel = fromLSSafe('default-model');
    if (!defaultModel || !v.includes(defaultModel)) {
      toLS('default-model', v[0]!);
    }
  }),
  trpc.stripe.getPrice.query().then(v => toLS('price', v)),
  trpc.stripe.getLimits.query().then(v => toLS('limits', v), console.error)
]).then(() => {
  loaded.value = true;
}, console.error);
</script>
