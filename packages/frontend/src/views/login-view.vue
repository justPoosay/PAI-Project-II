<template>
  <div
    class="flex h-full text-[#333333] bg-[#DDE6F0] dark:text-white dark:bg-[#2A1F2A] overflow-hidden"
  >
    <div class="w-full flex items-center justify-center p-4">
      <div
        class="w-full max-w-md [--bg:#E7F0F8] dark:[--bg:#352A35] rounded-xl p-8 shadow-md border-2 dark:border border-transparent bg-clip-padding [background:linear-gradient(var(--bg),var(--bg))_padding-box,linear-gradient(var(--angle,225deg),#FF000E,#FF7300,#FAD220,#138F3E,#3558A0,#880082)_border-box] animate-[rotate-gradient_5s_linear_infinite]"
      >
        <h1 class="text-3xl font-bold text-center mb-8">Welcome Back</h1>

        <div class="space-y-6">
          <button
            @click="signIn.social({ provider: 'github' })"
            class="w-full py-3 px-4 text-black dark:text-white font-medium rounded-lg bg-white dark:bg-[#352A35] border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#2A1F2A] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 transition-colors flex items-center justify-center space-x-2"
          >
            <img :src="GitHub" alt="GitHub" class="w-6 h-6" />
            <span>Sign in with GitHub</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GitHub from '@/assets/github.svg';
import { signIn } from '@/lib/auth-client';
</script>

<style lang="sass">
@keyframes rotate-gradient
  0%
    --angle: 0deg
  100%
    --angle: 360deg

@property --angle
  syntax: '<angle>'
  initial-value: 225deg
  inherits: false
</style>
