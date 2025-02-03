<template>
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[66] flex justify-center items-center" v-if="show" />
  <Transition>
    <div
      v-if="show"
      class="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[99] border light:border-2 bg-white/15 backdrop-blur-sm border-white/15 dark:border-[#7F7669] dark:bg-[#141516] rounded-lg flex flex-col items-center justify-center p-1"
    >
      <div class="flex w-full items-center justify-between">
        <h1 class="text-lg font-bold">Preferences</h1>
        <button class="p-1 rounded-full hover:bg-white/5 transition" @click="show = false">
          <XIcon class="w-5 h-5" />
        </button>
      </div>
      <div class="p-1">
        <form @submit.prevent.stop="form.handleSubmit">
          <div class="flex flex-col w-full">
            <form.Field name="name">
              <template v-slot="{ field }">
                <label :for="field.name">Name</label>
                <input
                  :id="field.name"
                  :name="field.name"
                  :value="field.state.value"
                  @input="field.handleChange(($event.target as HTMLInputElement).value)"
                  @blur="field.handleBlur"
                  class="bg-white/10 dark:bg-vue-black-mute text-white focus:outline-none focus:ring-0 w-full rounded p-1"
                />
              </template>
            </form.Field>
            <form.Field name="systemPrompt">
              <template v-slot="{ field }">
                <label :for="field.name">System Prompt</label>
                <textarea
                  :id="field.name"
                  :name="field.name"
                  :value="field.state.value"
                  @input="field.handleChange(($event.target as HTMLInputElement).value)"
                  @blur="field.handleBlur"
                  rows="7"
                  class="bg-white/10 dark:bg-vue-black-mute text-white focus:outline-none focus:ring-0 w-full rounded p-1"
                />
              </template>
            </form.Field>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { usePreferenceStore, type Preferences } from "@/stores/preferences";
import { useForm } from "@tanstack/vue-form";
import { XIcon } from "lucide-vue-next";

const preferenceStore = usePreferenceStore();
const show = defineModel<boolean>({ required: true });

const form = useForm({
  onSubmit({ value: { name, systemPrompt } }) {
    localStorage.setItem("name", name);
    localStorage.setItem("systemPrompt", systemPrompt);
  },
  defaultValues: {
    name: preferenceStore.preferences.name ?? "",
    systemPrompt: preferenceStore.preferences.systemPrompt ?? "",
  } satisfies Preferences,
});
</script>
