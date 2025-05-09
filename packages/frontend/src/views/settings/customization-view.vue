<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-2xl font-bold">Customize your experience</h1>
    <fieldset class="flex flex-col gap-1">
      <label class="text-md font-bold">What should __ Chat call you?</label>
      <input
        v-model="name"
        class="border-border focus:border-accent rounded-md border px-3 py-2 transition focus:outline-none"
        placeholder="Enter your name"
      />
    </fieldset>
    <fieldset class="flex flex-col gap-1">
      <label class="text-md font-bold">What do you do?</label>
      <input
        v-model="occupation"
        class="border-border focus:border-accent rounded-md border px-3 py-2 transition focus:outline-none"
        placeholder="Engineer, student, etc."
      />
    </fieldset>
    <fieldset class="flex flex-col gap-1">
      <label class="text-md font-bold">What traits should __ Chat have?</label>
      <textarea
        v-model="selectedTraits"
        class="border-border focus:border-accent min-h-24 rounded-md border px-3 py-2 transition focus:outline-none"
        placeholder="Enter traits seperated by commas (e.g. Chatty, Witty, Opinionated)"
      />
    </fieldset>
    <fieldset class="flex flex-col gap-1">
      <label class="text-md font-bold">Anything else __ Chat should know about you?</label>
      <textarea
        v-model="additionalInfo"
        class="border-border focus:border-accent min-h-24 rounded-md border px-3 py-2 transition focus:outline-none"
        placeholder="Interests, values, or preferences to keep in mind"
      />
    </fieldset>
    <h2 class="text-2xl font-bold">OR</h2>
    <fieldset class="flex flex-col gap-1">
      <label class="text-md font-bold">Custom System Prompt</label>
      <textarea
        v-model="systemPrompt"
        class="border-border focus:border-accent min-h-48 rounded-md border px-3 py-2 transition focus:outline-none"
        placeholder="Enter a custom system prompt for __ Chat"
      />
    </fieldset>
    <button
      class="bg-accent hover:bg-pink disabled:hover:bg-accent cursor-pointer self-end rounded-lg px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="
        name === prevState.name &&
        occupation === prevState.occupation &&
        selectedTraits === prevState.selectedTraits &&
        additionalInfo === prevState.additionalInfo &&
        systemPrompt === prevState.systemPrompt
      "
      @click="
        prevState = {
          name,
          occupation,
          selectedTraits,
          additionalInfo,
          systemPrompt
        }
      "
    >
      Save Preferences
    </button>
  </div>
</template>

<script setup lang="ts">
import { fromLS, toLS } from '@/lib/local';
import { ref, watch } from 'vue';

const prevState = ref({ ...fromLS('user-preferences'), systemPrompt: fromLS('system-prompt') });

const name = ref(prevState.value.name);
const occupation = ref(prevState.value.occupation);
const selectedTraits = ref(prevState.value.selectedTraits);
const additionalInfo = ref(prevState.value.additionalInfo);
const systemPrompt = ref(prevState.value.systemPrompt);

watch(prevState, ({ systemPrompt, ...state }) => {
  toLS('user-preferences', state);
  toLS('system-prompt', systemPrompt);
});
</script>
