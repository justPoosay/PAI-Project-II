<script setup lang="ts">
import { useRoute } from "vue-router";
import { onMounted, ref } from "vue";
import type { ClientBoundWebSocketMessage } from "../../shared";
import { isValidJSON, omit } from "@/lib/utils.ts";

type Message = import("@/lib/types.ts").Message & { streaming: boolean };

const route = useRoute();
const messages = ref<Message[]>([]);

let ws: WebSocket;
onMounted(async () => {
  ws = new WebSocket(`ws://${window.location.host}/api/chat/${route.params.id}`);
  ws.onmessage = ( event: MessageEvent<string> ) => {
    if ( !isValidJSON(event.data) ) return;
    const msg = JSON.parse(event.data) as ClientBoundWebSocketMessage;

    if ( msg.type === "message" ) {
      if ( msg.action === "create" )
        messages.value.push({ ...omit(msg, ["type", "action"]), createdAt: new Date(), streaming: false } satisfies Message);
    }

    if ( msg.type === "stream" ) {
      if ( msg.target === "message" ) {
        if ( msg.role === "chunk" )
          messages.value.map(( m ) => {
            if ( m.id === msg.id ) m.content += msg.content;
            return m;
          });
        if ( msg.role === "start" || msg.role === "end" )
          messages.value.map(( m ) => {
            if ( m.id === msg.id ) m.streaming = msg.role === "start";
            return m;
          });
      }
    }
  };

  const res = await fetch(`/api/chat/${route.params.id}/msgs`);
  if ( res.ok ) {
    const data = await res.json();
    messages.value = [...messages.value, ...data];
  }
});
</script>

<template>
  <div>

  </div>
</template>