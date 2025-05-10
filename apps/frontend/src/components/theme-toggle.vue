<template>
  <button
    :data-theme="theme"
    class="group relative inline-flex size-8 cursor-pointer items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-gray-200/5 [&_svg]:absolute [&_svg]:size-4 [&_svg]:scale-0 [&_svg]:-rotate-90 [&_svg]:transition-all [&_svg]:duration-200"
    @click="theme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'"
    v-tooltip="{
      content: theme === 'dark' ? 'Dark mode' : theme === 'light' ? 'Light mode' : 'Sytem (auto)',
      position: 'bottom'
    }"
  >
    <SunIcon class="group-data-[theme=light]:scale-100 group-data-[theme=light]:rotate-0" />
    <MoonIcon class="group-data-[theme=dark]:scale-100 group-data-[theme=dark]:rotate-0" />
    <SunMoonIcon class="group-data-[theme=system]:scale-100 group-data-[theme=system]:rotate-0" />
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
