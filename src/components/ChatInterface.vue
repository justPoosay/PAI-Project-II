<template>
  <div class="flex h-screen bg-vue-black">
    <!-- Sidebar -->
    <Sidebar/>

    <!-- Chat Area -->
    <div class="flex-1 flex flex-col">
      <!-- Chat Messages -->
      <div class="flex-1 overflow-y-auto p-4">
        <div class="max-w-5xl mx-auto">
          <div v-for="(message, i) in messages" :key="i" class="mb-2">
            <div
                :class="[
                'flex',
                message.role === 'user'
                ? 'justify-end'
                : 'justify-start'
              ]"
            >
              <div
                  :class="[
                  'max-w-[80%] p-3 relative',
                  message.role === 'user'
                    ? 'bg-teal-600 text-vue-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl'
                    : 'bg-vue-black-mute text-vue-white-soft rounded-tl-2xl rounded-tr-2xl rounded-br-2xl',
                ]"
              >
                <div v-html="parseMarkdown(message.content)" class="markdown-content"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="border-t border-vue-black-mute p-4">
        <div class="flex items-start max-w-2xl mx-auto">
          <button class="p-2 rounded-full hover:bg-vue-black-mute transition mt-1">
            <PaperclipIcon class="w-6 h-6 text-vue-white-soft"/>
          </button>
          <textarea
              v-model="input"
              @keydown="handleKeyDown"
              placeholder="Type a message..."
              class="flex-1 bg-vue-black-soft text-vue-white border-vue-black-mute rounded-lg px-4 py-2 mx-2 focus:outline-none focus:ring-2 focus:ring-indigo resize-none"
              rows="3"
          ></textarea>
          <button
              @click="sendMessage"
              class="p-2 bg-indigo text-vue-white rounded-full hover:bg-opacity-80 transition mt-1"
          >
            <SendIcon class="w-6 h-6"/>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { SendIcon, PaperclipIcon } from "lucide-vue-next";
import Sidebar from "@/components/Sidebar.vue";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import DOMPurify from "dompurify";
import { isValidJSON } from "@/lib/utils.ts";
import type { ClientBoundWebSocketMessage, ServerBoundWebSocketMessage } from "../../shared";
import { useRoute } from "vue-router";

interface Message {
  role: "user" | "assistant";
  content: string;
  finished: boolean;
}

const route = useRoute();
const messages = ref<Message[]>([]);
const input = ref("");

let ws: WebSocket;
const send = (data: ServerBoundWebSocketMessage) => ws.send(JSON.stringify(data));
onMounted(async() => {
  ws = new WebSocket(`ws://${window.location.host}/api/chat/${route.params.id}`);
  ws.onmessage = (event: MessageEvent<string>) => {
    if(!isValidJSON(event.data)) return;
    const msg = JSON.parse(event.data) as ClientBoundWebSocketMessage;

    if(msg.role === "chunk") {
      if(msg.type === "text-delta") {
        if(messages.value[messages.value.length - 1].finished) {
          messages.value.push({
            role: "assistant",
            content: msg.textDelta,
            finished: false,
          });
        } else {
          messages.value[messages.value.length - 1].content += msg.textDelta;
        }
      }

      if(msg.type === "tool-call") {
        // TODO
      }

      if(msg.type === "tool-result") {
        // TODO
      }
    }

    if(msg.role === "finish") {
      messages.value[messages.value.length - 1].finished = true;
      console.log(messages.value);
    }

    console.log(msg);
  };

  ws.onclose = (event) => {
    const isError = event.code !== 1000;
    const reason = event.reason || "Unknown";

    console.log(event);
  };

  // const res = await fetch(`/api/chat/${route.params.id}/msgs`);
  // if(res.ok) {
  //   const data = await res.json();
  //   messages.value = [...messages.value, ...data];
  // }
});

const sendMessage = () => {
  if(input.value.trim()) {
    messages.value.push({
      role: "user",
      content: input.value,
      finished: true,
    });
    send({
      role: "message",
      action: "create",
      content: input.value,
    });
    input.value = "";
    nextTick(() => {
      highlightCode();
    });
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if(e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

const parseMarkdown = (text: string) => {
  marked.setOptions({
    breaks: true,
    gfm: true,
  });
  return DOMPurify.sanitize(marked(text.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, "")) as string);
};

const highlightCode = () => {
  nextTick(() => {
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightBlock(block as HTMLElement);
    });
  });
};

onMounted(() => {
  highlightCode();
});
</script>

<style>
/* Add some basic styling for Markdown elements */
.markdown-content
{
  word-break : break-word;
}

.markdown-content .hljs
{
  background    : #1e1e1e;
  color         : #d4d4d4;
  border-radius : 0.5rem;
  padding       : 1rem;
  margin        : 0.5rem 0;
}

.markdown-content strong
{
  font-weight : bold;
}

.markdown-content em
{
  font-style : italic;
}

.markdown-content code:not(.hljs)
{
  background-color : rgba(255, 255, 255, 0.1);
  border-radius    : 0.25rem;
  padding          : 0.1rem 0.25rem;
  font-family      : monospace;
}

.markdown-content pre
{
  margin-top    : 0.5rem;
  margin-bottom : 0.5rem;
}

.markdown-content pre code
{
  background-color : transparent;
  padding          : 0;
}
</style>