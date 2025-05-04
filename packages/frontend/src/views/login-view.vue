<template>
  <div class="flex h-full overflow-hidden">
    <div class="absolute top-4 right-4 z-10">
      <ThemeToggle />
    </div>
    <div class="flex w-full items-center justify-center p-4">
      <div
        class="w-full max-w-md animate-[rotate-gradient_5s_linear_infinite] rounded-xl border-2 border-transparent bg-clip-padding p-8 shadow-md [--bg:var(--color-sidebar-light)] [background:linear-gradient(var(--bg),var(--bg))_padding-box,linear-gradient(var(--angle,225deg),#FF000E,#FF7300,#FAD220,#138F3E,#3558A0,#880082)_border-box] dark:border dark:[--bg:var(--color-sidebar-dark)]"
      >
        <h1 class="mb-8 text-center text-3xl font-bold">Welcome Back</h1>

        <div class="space-y-6">
          <button
            @click="
              signIn.social({
                provider: 'github',
                callbackURL: selfOrFirst($route.query['callbackURL']) ?? '/'
              })
            "
            class="flex w-full items-center justify-center space-x-2 rounded-xl border border-[#5A5245] bg-black px-4 py-3 font-medium text-white transition hover:bg-[#101213]"
          >
            <SiGithub class="size-6" />
            <span>Sign in with GitHub</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ThemeToggle from '@/components/theme-toggle.vue';
import { signIn } from '@/lib/auth-client';
import { selfOrFirst } from '@/lib/utils';
import { SiGithub } from 'vue-icons-plus/si';
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
