<template>
  <!-- Chat Area -->
  <div class="flex-1 flex flex-col relative">
    <div class="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
      <ModelSelector
        v-model="model"
      />
    </div>

    <!-- Chat Messages -->
    <div v-if="!messages.loading && !messages.error && messages.array.length" class="flex-1 overflow-y-auto p-4 pb-36">
      <div class="max-w-5xl mx-auto">
        <div v-for="(message, i) in messages.array" :key="i" class="mb-2 relative">
          <div
            :data-self="message.role === 'user'"
            class="flex justify-start data-[self=true]:justify-end items-end space-x-2"
          >
            <img
              v-if="message.role === 'assistant'"
              class="w-6 h-6"
              :alt="message.author"
              :src="modelInfo[message.author].logoSrc"
              width="24"
              v-tooltip="{ content: modelInfo[message.author].name, placement: 'left' }"
            />
            <div
              :data-self="message.role === 'user'"
              class="max-w-[80%] p-3 relative backdrop-blur-md rounded-tl-2xl rounded-tr-2xl shadow-sm bg-gradient-to-tr from-white/15 via-white/10 to-white/15 data-[self=true]:bg-gradient-to-tl data-[self=true]:from-white/25 data-[self=true]:via-white/20 data-[self=true]:to-white/25 data-[self=true]:rounded-bl-2xl data-[self=false]:rounded-br-2xl"
            >
              <div v-if="message.content" v-html="parseMarkdown(message.content)" class="markdown-content"/>
              <div v-else-if="message.role !== 'user' || !message.attachments?.length"
                   class="flex items-center justify-center">
                <Loader/>
              </div>
              <div v-if="message.role === 'user' && message.attachments?.length" class="flex flex-wrap">
                <a
                  v-for="attachment in message.attachments"
                  :key="attachment.id"
                  :href="`/api/upload/${attachment.id}`"
                  :download="attachment.image ? 'image.png' : 'file.txt'"
                  class="flex items-center p-1 bg-white/5 backdrop-blur-sm rounded-lg"
                >
                  <img
                    v-if="attachment.image"
                    :src="`/api/upload/${attachment.id}`"
                    class="rounded-lg"
                    alt="Attachment"
                    width="128"
                  />
                  <span v-else class="text-white/75">File</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center" v-if="!messages.loading && !messages.error && !messages.array.length">
        <h1 class="text-2xl font-bold">No messages yet</h1>
        <h2>Start typing to begin a conversation</h2>
      </div>
      <div class="text-center" v-else-if="messages.loading">
        <Loader/>
      </div>
      <div class="text-center" v-else>
        <h1 class="text-2xl font-bold">An error occurred</h1>
        <h2>{{ messages.error }}</h2>
      </div>
    </div>

    <!-- Input Area -->
    <div
      class="absolute bottom-4 left-4 right-4 z-10"
      @drop.prevent="upload($event.dataTransfer?.files)"
    >
      <div
        class="flex flex-col items-start max-w-2xl mx-auto bg-gradient-to-br from-vue-black/35 via-vue-black-soft/25 to-vue-black/35 backdrop-blur-sm rounded-xl p-2 shadow-lg"
      >
        <div v-if="uploads.length" class="flex">
          <div
            v-for="file in uploads"
            class="relative"
          >
            <button
              class="absolute -top-1.5 right-0 rounded-full bg-vue-black/75 p-[1px]"
              @click="uploads = uploads.filter(f => f.hash !== file.hash)"
            >
              <XIcon class="w-4 h-4"/>
            </button>
            <img
              v-if="file.image"
              :key="file.hash"
              :src="file.href"
              :data-disabled="!modelInfo[model].imageInput"
              class="w-12 h-12 rounded-lg mr-2 overflow-hidden data-[disabled=true]:grayscale"
              alt="File"
            />
          </div>
        </div>
        <textarea
          v-model="input"
          @keydown="handleKeyDown"
          placeholder="Type a message..."
          class="bg-transparent p-2 focus:outline-none resize-none w-full"
        />
        <div class="flex justify-between w-full text-white/75">
          <input
            type="file"
            multiple
            accept="image/*"
            class="hidden"
            id="file"
            @change.prevent="upload(($event.target as HTMLInputElement)?.files ?? undefined)"
            :disabled="!modelInfo[model].imageInput"
          >
          <label
            :aria-disabled="!modelInfo[model].imageInput"
            class="p-2 rounded-full aria-[disabled=false]:hover:bg-white/5 transition mt-1 aria-[disabled=false]:cursor-pointer aria-[disabled=true]:text-white/25"
            :title="modelInfo[model].imageInput ? 'Upload File' : 'This model does not support file input'"
            for="file"
          >
            <PaperclipIcon class="w-6 h-6 "/>
          </label>
          <button
            v-if="messages.array[messages.array.length - 1]?.finished ?? true"
            @click="sendMessage"
            class="p-2 rounded-full hover:bg-white/5 transition mt-1"
          >
            <SendIcon class="w-6 h-6"/>
          </button>
          <button
            v-else
            @click="send({ role: 'action', action: 'abort' })"
            class="p-2 rounded-full hover:bg-white/5 transition mt-1"
          >
            <CircleStopIcon class="w-6 h-6"/>
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
  CircleStopIcon,
  XIcon
  // HammerIcon,
  // CloudLightningIcon,
  // BracesIcon, GlobeIcon,
  // SearchIcon,
} from "lucide-vue-next";
import { Marked, Renderer } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import DOMPurify from "dompurify";
import { calculateHash, capitalize, isBackendAlive, isValidJSON } from "@/lib/utils.ts";
import type { ClientMessage as Message, ServerBoundWebSocketMessage } from "../../shared";
import { onBeforeRouteUpdate, useRoute } from "vue-router";
import { ClientBoundWebSocketMessageSchema, routes } from "../../shared/schemas.ts";
import { useConversationStore } from "@/stores/conversations.ts";
import { modelInfo } from "../../shared/constants.ts";
import ModelSelector from "@/components/ModelSelector.vue";
import router from "@/router";
import { useModelStore } from "@/stores/models.ts";
import type { Conversation } from "@/lib/types.ts";
import Loader from "@/components/Loader.vue";
import { z } from "zod";

type FileData = Omit<z.infer<(typeof routes["upload"])>[0], "id"> & { id?: string, href: string }

const route = useRoute();
const conversationStore = useConversationStore();
const modelStore = useModelStore();

const messages = ref<{ loading: boolean, error: string | null, array: Message[] }>({
  loading: true,
  error: null,
  array: []
});
const conversation = ref<Conversation | null>(conversationStore.conversations.find((c) => c.id === route.params.id) ?? null);
const input = ref("");
const uploads = ref<FileData[]>([]);

async function upload(fileList: FileList | undefined) {
  if(!fileList?.length || !modelInfo[model.value].imageInput) {
    return;
  }

  const files = Array.from<File>(fileList);
  const fileData = (await Promise.all(
    files.map<Promise<FileData>>(
      async file => ({
        hash: (await calculateHash(await file.arrayBuffer())).hex,
        href: URL.createObjectURL(file),
        image: file.type.startsWith("image/"),
      })
    )
  )).filter(f => !uploads.value.find(u => u.hash === f.hash));

  if(!fileData.length) {
    return;
  }

  uploads.value.push(...fileData);
  const formData = new FormData();
  files.forEach(file => formData.append("file", file));

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if(!res.ok) {
    console.log("Failed to upload files");
    uploads.value = uploads.value.filter(file => !fileData.find(f => f.hash === file.hash));
    return;
  }

  const result = routes["upload"].safeParse(await res.json());
  if(result.success) {
    uploads.value.forEach(file => {
      const data = result.data.find(f => f.hash === file.hash);
      if(data) {
        file.id = data.id;
        URL.revokeObjectURL(file.href);
        file.href = "/api/upload/" + data.id;
      }
    });
  } else {
    uploads.value = uploads.value.filter(file => !fileData.find(f => f.hash === file.hash));
  }
}

const model = ref(modelStore.models[0]);
watch(model, function(newValue, oldValue) {
  if(newValue !== oldValue && conversation.value && conversation.value.model !== newValue) {
    conversationStore.$modify({ id: conversation.value.id, model: newValue });
  }
});

const packetQueue = ref<ServerBoundWebSocketMessage[]>([]);

function send(data: ServerBoundWebSocketMessage) {
  if(!ws.value || ws.value.readyState !== WebSocket.OPEN) {
    packetQueue.value.push(data);
    console.log("WebSocket not open, queueing packet");
    return;
  }

  ws.value?.send(JSON.stringify(data));
}

// function getToolIcon(toolName: string) {
//   switch(toolName.toLowerCase()) {
//     case "eval":
//       return BracesIcon;
//     case "weather":
//       return CloudLightningIcon;
//     case "search":
//       return SearchIcon;
//     case "scrape":
//       return GlobeIcon;
//     default:
//       return HammerIcon;
//   }
// }

const ws = ref<WebSocket | null>(null);

async function init(id: typeof route.params.id) {
  id = id as string;
  const isNew = id === "new";
  console.log("Initializing conversation", id);
  ws.value?.close(); // to unsubscribe from the previous WebSocket connection server-side
  messages.value = { loading: !isNew, error: null, array: [] };
  const c = conversationStore.conversations.find((c) => c.id === id) ?? null;
  conversation.value = c;
  model.value = c?.model ?? modelStore.models[0];
  if(isNew) {
    return;
  }
  const url = "ws://" + window.location.host + "/api/" + id;
  ws.value = new WebSocket(url);
  ws.value.onmessage = function(ev) {
    if(typeof ev.data !== "string" || !isValidJSON(ev.data)) return;
    const result = ClientBoundWebSocketMessageSchema.safeParse(JSON.parse(ev.data));
    if(!result.success) return;
    const msg = result.data;

    if(msg.role === "chunk") {
      if(messages.value.array[messages.value.array.length - 1]?.finished) {
        messages.value.array.push({
          role: "assistant",
          content: "",
          finished: false,
          author: model.value
        });
      }

      if(msg.type === "text-delta") {
        messages.value.array[messages.value.array.length - 1].content += msg.textDelta;
      }

      if(msg.type === "tool-call") {
        const lastMessage = messages.value.array[messages.value.array.length - 1];
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
        // TODO (maybe)
      }
    }

    if(msg.role === "finish") {
      if(messages.value.array[messages.value.array.length - 1]?.role === "user") {
        messages.value.array.push({
          role: "assistant",
          content: "",
          finished: false,
          author: model.value
        });
      }
      messages.value.array[messages.value.array.length - 1].finished = true;
    }

    if(msg.role === "rename") {
      conversationStore.$modify({ id, requestChange: false, name: msg.name });
    }
  };

  ws.value.onopen = function() {
    console.log("Connected to WebSocket");
    packetQueue.value.forEach(send);
  };

  ws.value.onclose = function() {
    console.log("Disconnected from WebSocket");
  };

  await fetchMessages(id);
}

async function fetchMessages(id: typeof route.params.id) {
  try {
    const res = await fetch(`/api/${id}/messages`);
    if(!res.ok) {
      const alive = await isBackendAlive();
      if(!alive) throw new Error("Backend seems to be dead");
      throw new Error(res.statusText);
    }
    const result = routes["[id]"]["messages"].safeParse(await res.json());
    if(!result.success) throw new Error("Backend provided bogus data");
    messages.value = { loading: false, error: null, array: result.data.map((msg) => ({ ...msg, finished: true })) };
  } catch(e) {
    if(e instanceof Error) {
      messages.value = { loading: false, error: e.message, array: [] };
    }
  }
}

onBeforeRouteUpdate(async(to, from, next) => {
  console.log("Route update", to.params.id, from.params.id);
  await init(to.params.id);
  next();
});

onMounted(async() => {
  await init(route.params.id);

  // await conversationStore.$fetch();
  // await modelStore.$fetch();
});

async function sendMessage() {
  if(messages.value.array[messages.value.array.length - 1]?.role === "user") {
    return;
  }

  if(input.value.trim() || uploads.value.length) {
    if(route.params.id === "new") {
      const { id } = await conversationStore.$create({ model: model.value });
      await router.push({ name: "c", params: { id } });
    }

    const attachments = modelInfo[model.value].imageInput
      ? uploads.value.filter(f => !!f.id) as { id: string, image: boolean }[]
      : undefined;

    messages.value.array.push({
      role: "user",
      content: input.value,
      finished: true,
      attachments,
    });

    send({
      role: "message",
      action: "create",
      content: input.value,
      attachments,
      model: model.value,
    });

    input.value = "";
    if(attachments) uploads.value = [];
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if(e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function parseMarkdown(text: string) {
  const stock = new Marked(); // for parsing blockquotes
  const marked = new Marked(
    markedHighlight({
      emptyLangClass: "hljs",
      langPrefix: "hljs language-",
      highlight(code, lang) {
        return lang
          ? hljs.getLanguage(lang)
            ? hljs.highlight(code, { language: lang }).value
            : hljs.highlightAuto(code).value
          : hljs.highlightAuto(code).value;
      },
    })
  );

  const renderer = new Renderer();
  renderer.blockquote = (quote) => {
    const match = quote.text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)]/);
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
    return stock.parse(quote.raw, { async: false });
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

.markdown-content hr
  @apply border-t border-white/30 my-4

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

.v-popper--theme-tooltip .v-popper__inner
  @apply bg-white/15 backdrop-blur-md

.v-popper--theme-tooltip .v-popper__arrow-outer
  @apply border-white/15
</style>