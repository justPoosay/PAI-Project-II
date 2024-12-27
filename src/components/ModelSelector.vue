<template>
  <div class="flex flex-col select-none">
    <div
      :data-expanded="expanded"
      class="bg-gradient-to-r from-white/15 via-white/10 to-white/15 backdrop-blur-sm px-3 py-1 rounded-lg data-[expanded=true]:rounded-b-none cursor-pointer transition-all duration-100 ease-out flex justify-center"
      @click="toggleExpanded"
    >
      <div class="flex space-x-2 items-center">
        <img
          :src="modelInfo[selected!].logoSrc"
          :alt="selected"
          width="16"
        />
        <p>{{ modelInfo[selected!].name }}</p>
      </div>
    </div>
    <div
      :data-expanded="expanded"
      class="bg-gradient-to-r from-white/15 via-white/10 to-white/15 backdrop-blur-sm rounded-b-lg shadow-lg p-1 data-[expanded=false]:opacity-0 duration-100 ease-out"
    >
      <div class="h-[1px] bg-white/15 w-full mb-1"/>
      <ul class="space-y-1">
        <li
          v-for="model in modelArray"
          :key="model"
          @click="selectOption(model)"
          :data-current="selected === model"
          class="px-2 py-1 rounded-lg hover:bg-gradient-to-br cursor-pointer data-[current=true]:bg-gradient-to-br"
        >
          <div class="flex space-x-2 items-center">
            <img
              :src="modelInfo[model].logoSrc"
              :alt="model"
              width="16"
            />
            <p>{{ modelInfo[model].name }}</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { modelArray, modelInfo } from "../../shared/constants.ts";
import type { Model } from "../../shared";

const expanded = ref<boolean>(false);
const selected = defineModel<Model>();

function toggleExpanded() {
  expanded.value = !expanded.value;
}

function selectOption(value: Model) {
  selected.value = value;
  expanded.value = false;
}
</script>