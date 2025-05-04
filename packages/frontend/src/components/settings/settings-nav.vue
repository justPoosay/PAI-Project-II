<template>
  <nav>
    <RouterLink v-for="[route, name] in entries(routes)" :key="route" :to="{ name: route }">
      {{ name }}
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { entries } from 'common/utils';
import { RouterLink } from 'vue-router';

const routes = {
  account: 'Account'
} satisfies Record<string, string>;
</script>
