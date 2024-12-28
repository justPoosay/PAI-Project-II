<template>
  <div class="flex justify-center items-center">
    <span class="w-2 h-2 bg-white rounded-full mx-1 opacity-30"
          style="animation: pulse 1.4s infinite ease-in-out;"/>
    <span class="w-2 h-2 bg-white rounded-full mx-1 opacity-30"
          style="animation: pulse 1.4s infinite ease-in-out; animation-delay: 0.2s;"/>
    <span class="w-2 h-2 bg-white rounded-full mx-1 opacity-30"
          style="animation: pulse 1.4s infinite ease-in-out; animation-delay: 0.4s;"/>
  </div>
</template>

<style lang="sass">
@keyframes pulse
  0%, 100%
    @apply opacity-30
  50%
    @apply opacity-100
</style>