<template>
  <div
    class="flex h-full overflow-hidden bg-[#DDE6F0] text-[#333333] dark:bg-[#2A1F2A] dark:text-white"
  >
    <div class="flex w-full items-center justify-center p-4">
      <div
        class="w-full max-w-md animate-[rotate-gradient_5s_linear_infinite] rounded-xl border-2 border-transparent bg-clip-padding p-8 shadow-md [--bg:#E7F0F8] [background:linear-gradient(var(--bg),var(--bg))_padding-box,linear-gradient(var(--angle,225deg),#FF000E,#FF7300,#FAD220,#138F3E,#3558A0,#880082)_border-box] dark:border dark:[--bg:#352A35]"
      >
        <h1 class="mb-8 text-center text-3xl font-bold">Welcome Back</h1>

        <div class="space-y-6">
          <button
            @click="
              signIn.social({
                provider: 'github',
                callbackURL: selfOrFirst($route.query.callbackURL) ?? '/'
              })
            "
            class="flex w-full items-center justify-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-black transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-[#352A35] dark:text-white dark:hover:bg-[#2A1F2A] dark:focus:ring-purple-500"
          >
            <img :src="GitHub" alt="GitHub" class="h-6 w-6" />
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
import { selfOrFirst } from '@/lib/utils';
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
