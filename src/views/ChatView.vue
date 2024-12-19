<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref } from "vue";
import type { Message } from "@/lib/types";

const route = useRoute();
const messages = ref<Message[]>([]);

let ws: WebSocket;

</script>

<template>
  <p>{{ $route.params.id }}</p>
</template>