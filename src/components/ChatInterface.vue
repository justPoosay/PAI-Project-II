<template>
  <div class="flex h-screen bg-vue-black">
    <!-- Sidebar -->
    <Sidebar/>

    <!-- Chat Area -->
    <div class="flex-1 flex flex-col">
      <!-- Chat Messages -->
      <div class="flex-1 overflow-y-auto p-4" ref="chatContainer">
        <div class="max-w-5xl mx-auto">
          <div v-for="(message, i) in messages" :key="i" class="mb-2 relative">
            <div
                :class="[
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
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
                <div v-if="message.content" v-html="parseMarkdown(message.content)" class="markdown-content"></div>
                <div v-else class="flex items-center justify-center">
                  <div class="loader">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="message.toolCalls && message.toolCalls.length > 0" class="absolute top-0 left-0 flex">
              <div v-for="(tool, index) in message.toolCalls" :key="index" class="relative">
                <div
                    v-tooltip="{ content: DOMPurify.sanitize(`
                    <b>${tool.name}</b>
                    <pre>${Object.entries(tool.args).map(([k,v]) => ` <b>${k}:</b> ${v}`).join('<br />')}</pre>
                    `.trim()), html: true }"
                    class="w-6 h-6 bg-indigo text-vue-white rounded-full flex items-center justify-center -mt-2 -ml-2"
                    :style="{ zIndex: 10 - index }"
                >
                  <component :is="getToolIcon(tool.name)" class="w-4 h-4"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-4">
        <div class="flex flex-col items-start max-w-2xl mx-auto bg-vue-black-soft rounded-xl p-2 shadow-lg">
          <textarea
              v-model="input"
              @keydown="handleKeyDown"
              placeholder="Type a message..."
              class="bg-transparent text-vue-white border-vue-black-mute p-2 focus:outline-none resize-none w-full"
          />
          <div class="flex justify-between w-full">
            <button class="p-2 rounded-full hover:bg-vue-black-mute transition mt-1">
              <PaperclipIcon class="w-6 h-6 text-vue-white-soft"/>
            </button>
            <button
                @click="sendMessage"
                class="p-2 bg-indigo text-vue-white rounded-full hover:bg-vue-black-mute transition mt-1"
                :data-empty="!input.trim()"
            >
              <SendIcon class="w-6 h-6"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import {
  SendIcon,
  PaperclipIcon,
  HammerIcon,
  CloudLightningIcon, BracesIcon
} from "lucide-vue-next";
import Sidebar from "@/components/Sidebar.vue";
import { marked, type MarkedOptions } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import DOMPurify from "dompurify";
import { isValidJSON } from "@/lib/utils.ts";
import type { ClientMessage as Message, ServerBoundWebSocketMessage } from "../../shared";
import { onBeforeRouteUpdate, useRoute } from "vue-router";
import "floating-vue/dist/style.css";
import { ClientBoundWebSocketMessageSchema, routes } from "../../shared/schemas.ts";
import { useChatStore } from "@/stores/chats.ts";

const route = useRoute();
const messages = ref<Message[]>([]);
const input = ref("");
const chatContainer = ref<HTMLElement | null>(null);
const isAtBottom = ref(true);

function scrollToBottom() {
  if(chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
}

function checkIfAtBottom() {
  if(chatContainer.value) {
    const { scrollTop, scrollHeight, clientHeight } = chatContainer.value;
    isAtBottom.value = scrollTop + clientHeight >= scrollHeight - 10;
  }
}

function getToolIcon(toolName: string) {
  switch(toolName.toLowerCase()) {
    case "eval":
      return BracesIcon;
    case "weather":
      return CloudLightningIcon;
    default:
      return HammerIcon;
  }
}

const ws = ref<WebSocket | null>(null);

async function init(id: typeof route.params.id) {
  ws.value?.close(); // to unsubscribe from the previous WebSocket connection server-side
  const url = "ws://" + window.location.host + "/api/" + id;
  ws.value = new WebSocket(url);
  ws.value.onmessage = function(ev) {
    if(typeof ev.data !== "string" || !isValidJSON(ev.data)) return;
    const result = ClientBoundWebSocketMessageSchema.safeParse(JSON.parse(ev.data));
    if(!result.success) return;
    const msg = result.data;

    if(msg.role === "chunk") {
      if(messages.value[messages.value.length - 1]?.finished) {
        messages.value.push({
          role: "assistant",
          content: "",
          finished: false,
        });
      }

      if(msg.type === "text-delta") {
        messages.value[messages.value.length - 1].content += msg.textDelta;
      }

      if(msg.type === "tool-call") {
        const lastMessage = messages.value[messages.value.length - 1];
        if(!lastMessage.toolCalls) {
          lastMessage.toolCalls = [];
        }
        lastMessage.toolCalls.push({
          id: msg.toolCallId,
          name: msg.toolName,
          args: msg.args,
        });
      }

      if(msg.type === "tool-result") {
        // TODO
      }
    }

    if(msg.role === "finish") {
      messages.value[messages.value.length - 1].finished = true;
    }

    if(msg.role === "rename") {
      useChatStore().chats.map((chat) => {
        if(chat.id === id) {
          chat.name = msg.name;
        }
        return chat;
      });
    }

    nextTick(() => {
      highlightCode();
      if(isAtBottom.value) {
        scrollToBottom();
      }
    });
  };

  ws.value.onopen = function() {
    console.log("Connected to WebSocket");
  };

  ws.value.onclose = function(ev) {
    console.log("Disconnected from WebSocket");
  };

  await fetchMessages(id);
}

async function fetchMessages(id: typeof route.params.id) {
  try {
    const res = await fetch(`/api/${id}/messages.json`);
    if(!res.ok) throw new Error("Failed to fetch messages");
    const result = routes["[id]"]["messages.json"].safeParse(await res.json());
    if(result.success) messages.value = result.data.map((msg) => ({ ...msg, finished: true }));
  } catch(e) {
    // TODO
    console.error(e);
  }
}

function send(data: ServerBoundWebSocketMessage) {
  ws.value?.send(JSON.stringify(data));
}

onBeforeRouteUpdate(async(to, from, next) => {
  if(to.params.id !== from.params.id) {
    await init(to.params.id);
  }
  next();
});

onMounted(async() => {
  await init(route.params.id);
  if(chatContainer.value) {
    chatContainer.value.addEventListener("scroll", checkIfAtBottom);
  }
});

function sendMessage() {
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
      scrollToBottom();
    });
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if(e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function parseMarkdown(text: string) {
  marked.setOptions({
    highlight: function(code: string, lang: string) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
    breaks: true,
    gfm: true,
    headerIds: true,
    headerPrefix: "header-"
  } as MarkedOptions);

  return DOMPurify.sanitize(marked(text.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, "")) as string);
}

function highlightCode() {
  nextTick(() => {
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
  });
}

watch(messages, () => {
  nextTick(() => {
    if(isAtBottom.value) {
      scrollToBottom();
    }
  });
}, { deep: true });

onMounted(() => {
  highlightCode();
  scrollToBottom();
});
</script>

<style>
/* Add some basic styling for Markdown elements */
.markdown-content {
  word-break: break-word;
}

.markdown-content .hljs {
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 0.5rem 0;
}

.markdown-content strong {
  font-weight: bold;
}

.markdown-content em {
  font-style: italic;
}

.markdown-content code:not(.hljs) {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
  padding: 0.1rem 0.25rem;
  font-family: monospace;
}

.markdown-content pre {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
}

.markdown-content h1 {
  font-size: 2em;
  font-weight: bold;
  margin-top: 0.67em;
  margin-bottom: 0.67em;
}

.markdown-content h2 {
  font-size: 1.5em;
  font-weight: bold;
  margin-top: 0.83em;
  margin-bottom: 0.83em;
}

.markdown-content h3 {
  font-size: 1.17em;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 1em;
}

.markdown-content h4 {
  font-size: 1em;
  font-weight: bold;
  margin-top: 1.33em;
  margin-bottom: 1.33em;
}

.markdown-content h5 {
  font-size: 0.83em;
  font-weight: bold;
  margin-top: 1.67em;
  margin-bottom: 1.67em;
}

.markdown-content h6 {
  font-size: 0.67em;
  font-weight: bold;
  margin-top: 2.33em;
  margin-bottom: 2.33em;
}

.loader {
  display: flex;
  justify-content: center;
  align-items: center;
}

.dot {
  width: 8px;
  height: 8px;
  background-color: #fff;
  border-radius: 50%;
  margin: 0 4px;
  opacity: 0.3;
  animation: pulse 1.4s infinite ease-in-out;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}
</style>