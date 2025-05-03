<template>
  <button
    class="relative inline-flex size-8 cursor-pointer items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-gray-200/5"
    @click="theme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'"
  >
    <SunIcon
      class="absolute size-4 scale-0 -rotate-90 transition-all duration-200 data-[current=true]:scale-100 data-[current=true]:rotate-0"
      :data-current="theme === 'light'"
    />
    <MoonIcon
      class="absolute size-4 scale-0 -rotate-90 transition-all duration-200 data-[current=true]:scale-100 data-[current=true]:rotate-0"
      :data-current="theme === 'dark'"
    />
    <SunMoonIcon
      class="absolute size-4 scale-0 -rotate-90 transition-all duration-200 data-[current=true]:scale-100 data-[current=true]:rotate-0"
      :data-current="theme === 'system'"
    />
  </button>
</template>

<script setup lang="ts">
import { fromLS, toLS } from '@/lib/local';
import { setTheme } from '@/lib/utils';
import { MoonIcon, SunIcon, SunMoonIcon } from 'lucide-vue-next';
import { ref, watch } from 'vue';

const theme = ref(fromLS('theme'));
watch(theme, theme => {
  setTheme(theme);
  toLS('theme', theme);
});
</script>
