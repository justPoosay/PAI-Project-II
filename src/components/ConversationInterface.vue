<template>
  <!-- Chat Area -->
  <div class="flex-1 flex flex-col relative">
    <div class="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
      <ModelSelector
        v-model="model"
      />
    </div>

    <!-- Chat Messages -->
    <div class="flex-1 overflow-y-auto p-4 pb-36" ref="chatContainer">
      <div class="max-w-5xl mx-auto">
        <div v-for="(message, i) in messages" :key="i" class="mb-2 relative">
          <div
            :data-self="message.role === 'user'"
            class="flex justify-start data-[self=true]:justify-end"
          >
            <div
              :data-self="message.role === 'user'"
              class="max-w-[80%] p-3 relative backdrop-blur-md rounded-tl-2xl rounded-tr-2xl shadow-sm bg-gradient-to-tr from-white/15 via-white/10 to-white/15 data-[self=true]:bg-gradient-to-tl data-[self=true]:from-white/25 data-[self=true]:via-white/20 data-[self=true]:to-white/25 data-[self=true]:rounded-bl-2xl data-[self=false]:rounded-br-2xl"
            >
              <img
                v-if="message.role === 'assistant'"
                class="absolute -bottom-0 -left-8 w-6 h-6"
                :alt="message.author"
                :src="modelInfo[message.author].logoSrc"
                width="24"
                v-tooltip="{ content: modelInfo[message.author].name, placement: 'left' }"
              />
              <div v-if="message.content" v-html="parseMarkdown(message.content)" class="markdown-content"></div>
              <div v-else class="flex items-center justify-center">
                <div class="flex justify-center items-center">
                  <span class="w-2 h-2 bg-white rounded-full mx-1 opacity-30"
                        style="animation: pulse 1.4s infinite ease-in-out;"/>
                  <span class="w-2 h-2 bg-white rounded-full mx-1 opacity-30"
                        style="animation: pulse 1.4s infinite ease-in-out; animation-delay: 0.2s;"/>
                  <span class="w-2 h-2 bg-white rounded-full mx-1 opacity-30"
                        style="animation: pulse 1.4s infinite ease-in-out; animation-delay: 0.4s;"/>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="message.role === 'assistant' && message.toolCalls && message.toolCalls.length > 0"
            class="absolute -top-5 -left-5 flex p-1 bg-gradient-to-r from-white/20 via-white/15 to-white/20 backdrop-blur-md rounded-full"
          >
            <div
              v-for="(tool, index) in message.toolCalls" :key="index"
              v-tooltip="{
                content: `<div class='markdown-content'>${parseMarkdown(`
### **${tool.name}**
${Object.entries(tool.args).map(([key, value]) => {
  if (typeof value === 'string') {
    return `- **${key}**:\n\`\`\`\n${value.replace('```', '\`\`\`')}\n\`\`\``;
  } else {
    return `- **${key}**: \`${value}\``;
  }
}).join('\n')}
                `)}</div>`,
                html: true,
                placement: 'bottom'
              }"
              class="w-6 h-6 bg-indigo rounded-full flex items-center justify-center"
              :style="{ zIndex: 10 - index }"
            >
              <component :is="getToolIcon(tool.name)" class="w-4 h-4"/>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="absolute bottom-4 left-4 right-4 z-10">
      <div
        class="flex flex-col items-start max-w-2xl mx-auto bg-gradient-to-br from-vue-black/35 via-vue-black-soft/25 to-vue-black/35 backdrop-blur-sm rounded-xl p-2 shadow-lg"
      >
          <textarea
            v-model="input"
            @keydown="handleKeyDown"
            placeholder="Type a message..."
            class="bg-transparent p-2 focus:outline-none resize-none w-full"
          />
        <div class="flex justify-between w-full text-white/75">
          <button class="p-2 rounded-full hover:bg-white/5 transition mt-1">
            <PaperclipIcon class="w-6 h-6 "/>
          </button>
          <button
            @click="sendMessage"
            class="p-2 bg-indigo rounded-full hover:bg-white/5 transition mt-1"
            :data-empty="!input.trim()"
          >
            <SendIcon class="w-6 h-6"/>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import "floating-vue/dist/style.css";
import "highlight.js/styles/github-dark.css";

import { ref, onMounted, watch } from "vue";
import {
  SendIcon,
  PaperclipIcon,
  HammerIcon,
  CloudLightningIcon,
  BracesIcon, GlobeIcon,
  SearchIcon,
} from "lucide-vue-next";
import { Marked, Renderer } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import DOMPurify from "dompurify";
import { capitalize, isValidJSON } from "@/lib/utils.ts";
import type { ClientMessage as Message, ServerBoundWebSocketMessage } from "../../shared";
import { onBeforeRouteUpdate, useRoute } from "vue-router";
import { ClientBoundWebSocketMessageSchema, routes } from "../../shared/schemas.ts";
import { useConversationStore } from "@/stores/conversations.ts";
import { modelInfo } from "../../shared/constants.ts";
import ModelSelector from "@/components/ModelSelector.vue";
import router from "@/router";
import { useModelStore } from "@/stores/models.ts";

const conversationStore = useConversationStore();
const modelStore = useModelStore();
const route = useRoute();
const input = ref("");

const messages = ref<Message[]>([]);

const model = ref(modelStore.models[0]);
const acknowledged = ref(true);
watch(model, function(newValue, oldValue) {
  if(newValue !== oldValue) {
    if(!acknowledged.value) {
      msgBuffer.value = msgBuffer.value.filter((msg) => msg.role !== "modify" || msg.action !== "model"); // Remove any previous model change messages
    }
    send({
      role: "modify",
      action: "model",
      model: newValue,
    });
    acknowledged.value = false;
  }
});

const msgBuffer = ref<ServerBoundWebSocketMessage[]>([]);

function send(data: ServerBoundWebSocketMessage) {
  if(ws.value?.readyState !== WebSocket.OPEN) {
    msgBuffer.value.push(data);
    console.log({ message: "WebSocket not open, queueing message", data, queued: msgBuffer.value });
    return;
  }
  if(!acknowledged.value && (data.role !== "modify" || data.action !== "model")) { // Don't queue model change messages
    msgBuffer.value.push(data);
    console.log({ message: "Server didn't acknowledge, queueing message", data, queued: msgBuffer.value });
    return;
  }
  ws.value?.send(JSON.stringify(data));
}

function getToolIcon(toolName: string) {
  switch(toolName.toLowerCase()) {
    case "eval":
      return BracesIcon;
    case "weather":
      return CloudLightningIcon;
    case "search":
      return SearchIcon;
    case "scrape":
      return GlobeIcon;
    default:
      return HammerIcon;
  }
}

const ws = ref<WebSocket | null>(null);

async function init(id: typeof route.params.id) {
  id = id as string;
  ws.value?.close(); // to unsubscribe from the previous WebSocket connection server-side
  messages.value = [];
  if(id === "new") {
    console.log("Creating new conversation");
    model.value = modelStore.models[0];
    return;
  }
  const url = "ws://" + window.location.host + "/api/" + id;
  console.log("Connecting to WebSocket @" + url);
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
          author: model.value
        });
      }

      if(msg.type === "text-delta") {
        messages.value[messages.value.length - 1].content += msg.textDelta;
      }

      if(msg.type === "tool-call") {
        const lastMessage = messages.value[messages.value.length - 1];
        if(lastMessage.role === "user") return; // this should never happen
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
      conversationStore.$rename(id, msg.name, false);
    }

    if(msg.role === "setup") {
      if(acknowledged.value) { // Don't overwrite the model if it got changed locally
        model.value = msg.model;
      }
    }

    if(msg.role === "ack") {
      if(!acknowledged.value) {
        acknowledged.value = true;
        if(msgBuffer.value.length > 0) {
          console.log("Server acknowledged");
          console.log("Releasing " + msgBuffer.value.length + " queued messages");
          msgBuffer.value.forEach(send);
          msgBuffer.value = [];
        }
      }
    }
  };

  ws.value.onopen = function() {
    console.log("Connected to WebSocket");
    if(acknowledged.value) {
      msgBuffer.value.forEach(send);
      msgBuffer.value = [];
    } else {
      const modelChangeMessage = msgBuffer.value.find((msg) => msg.role === "modify" && msg.action === "model");
      if(modelChangeMessage) {
        send(modelChangeMessage);
      }
      msgBuffer.value = msgBuffer.value.filter((msg) => msg.role !== "modify" || msg.action !== "model");
    }
  };

  ws.value.onclose = function(ev) {
    console.log("Disconnected from WebSocket");
    msgBuffer.value = [];
  };

  await fetchMessages(id);
}

async function fetchMessages(id: typeof route.params.id) {
  try {
    const res = await fetch(`/api/${id}/messages`);
    if(!res.ok) throw new Error("Failed to fetch messages");
    const result = routes["[id]"]["messages"].safeParse(await res.json());
    if(result.success) messages.value = result.data.map((msg) => ({ ...msg, finished: true }));
  } catch(e) {
    // TODO
    console.error(e);
  }
}

onBeforeRouteUpdate(async(to, _, next) => {
  await init(to.params.id);
  next();
});

onMounted(async() => {
  await init(route.params.id);

  await conversationStore.$fetch();
  await modelStore.$fetch();
});

async function sendMessage() {
  if(messages.value[messages.value.length - 1]?.role === "user") {
    return;
  }

  if(input.value.trim()) {
    if(route.params.id === "new") {
      const { id } = await conversationStore.$create();
      await router.push({ name: "c", params: { id } });
    }

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
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if(e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function parseMarkdown(text: string) {
  const marked = new Marked(
    markedHighlight({
      emptyLangClass: "hljs",
      langPrefix: "hljs language-",
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
    })
  );

  const renderer = new Renderer();
  renderer.blockquote = (quote) => {
    const match = quote.text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/);
    if(match) {
      const type = match[1].toLowerCase();
      const title = capitalize(type);
      return `<blockquote data-type="${type}">${
        quote.text
        .replace(match[0], title)
        .split("\n")
        .filter(Boolean)
        .map(v => `<p${v === title ? " class=\"callout-title\"" : ""}>${v}</p>`)
        .join("\n")
      }</blockquote>`;
    }
    return `<blockquote>${
      quote.text
      .split("\n")
      .filter(Boolean)
      .map(v => `<p>${v}</p>`)
      .join("\n")
    }</blockquote>`;
  };

  marked.use({ renderer });

  return DOMPurify.sanitize(
    marked.parse(
      text.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ""),
      {
        async: false,
        breaks: true,
        gfm: true,
      }
    )
  );
}
</script>

<style lang="sass">
.markdown-content
  @apply break-words

.markdown-content pre
  @apply rounded overflow-x-auto

// \`\`\`\n<content>\n\`\`\`
.markdown-content pre code.hljs
  @apply block bg-white/5 backdrop-blur-sm text-white/80 p-1 rounded font-['Monaspace_Neon'] text-sm mb-2

// **<content>**
.markdown-content strong
  @apply font-bold

// *<content>*
.markdown-content em
  @apply italic

// `<content>`
.markdown-content code:not(.hljs)
  @apply bg-white/5 backdrop-blur-sm rounded p-1 font-['Monaspace_Neon'] text-sm

// # <content>
.markdown-content h1
  @apply text-3xl font-bold mt-2 mb-2

// ## <content>
.markdown-content h2
  @apply text-2xl font-bold mt-2 mb-2

// ### <content>
.markdown-content h3
  @apply text-xl font-bold mt-2 mb-2

// #### <content>
.markdown-content h4
  @apply text-lg font-bold mt-2 mb-2

// <i>. <content>
.markdown-content ol
  @apply list-decimal list-outside ml-6 mb-4
  & ol, & ul
    @apply mt-2 mb-2

// - <content>
.markdown-content ul
  @apply list-disc list-outside ml-6 mb-4
  & ul, & ol
    @apply mt-2 mb-2

// Nested list items
.markdown-content li
  @apply mb-1
  & > ul, & > ol
    @apply ml-4

// Blockquote
.markdown-content blockquote
  @apply border-l-4 border-white/30 pl-4 py-1 my-4 italic bg-white/5 rounded

  &[data-type="note"],
  &[data-type="tip"],
  &[data-type="important"],
  &[data-type="warning"],
  &[data-type="caution"]
    @apply not-italic

    .callout-title
      @apply font-bold

  &[data-type="note"],
  &[data-type="tip"]
    @apply border-blue-500

    .callout-title
      @apply text-blue-500

  &[data-type="important"]
    @apply border-violet-700

    .callout-title
      @apply text-violet-500

  &[data-type="warning"]
    @apply border-yellow-500

    .callout-title
      @apply text-yellow-500

  &[data-type="caution"]
    @apply border-red-500

    .callout-title
      @apply text-red-500

// Table
.markdown-content table
  @apply w-full border-collapse my-4
  th, td
    @apply border border-white/30 p-2

  th
    @apply bg-white/10 font-bold

  tr:nth-child(even)
    @apply bg-white/5

.hljs-comment
  @apply font-['Monaspace_Radon'] text-gray-300/75 italic

@keyframes pulse
  0%, 100%
    @apply opacity-30
  50%
    @apply opacity-100

.v-popper--theme-tooltip .v-popper__inner
  @apply bg-white/15 backdrop-blur-md

.v-popper--theme-tooltip .v-popper__arrow-outer
  @apply border-white/15
</style>