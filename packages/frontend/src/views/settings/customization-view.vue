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
    <button
      class="bg-accent hover:bg-pink disabled:hover:bg-accent cursor-pointer self-end rounded-lg px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="
        name === prevState.name &&
        occupation === prevState.occupation &&
        selectedTraits === prevState.selectedTraits &&
        additionalInfo === prevState.additionalInfo
      "
      @click="
        prevState = {
          name,
          occupation,
          selectedTraits,
          additionalInfo
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

const prevState = ref(fromLS('user-preferences'));

const name = ref(prevState.value.name);
const occupation = ref(prevState.value.occupation);
const selectedTraits = ref(prevState.value.selectedTraits);
const additionalInfo = ref(prevState.value.additionalInfo);

watch(prevState, state => toLS('user-preferences', state));
</script>
