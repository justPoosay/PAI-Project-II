<template>
  <!-- Chat Area -->
  <div class="flex-1 flex flex-col relative">
    <!-- Chat Messages -->
    <div v-if="!messages.loading && !messages.error && messages.array.length" class="flex-1 overflow-y-auto p-4 pb-36">
      <div class="max-w-5xl mx-auto">
        <div v-for="(message, i) in messages.array" :key="i" class="mb-2 relative">
          <div :data-self="message.role === 'user'"
            class="flex justify-start data-[self=true]:justify-end items-end space-x-2">
            <img v-if="message.role === 'assistant'" class="w-6 h-6 max-md:hidden dark:order-first"
              :alt="message.author" :src="modelInfo[message.author].logoSrc" width="24"
              v-tooltip="{ content: modelInfo[message.author].name, placement: 'left' }" />
            <div :data-self="message.role === 'user'"
              class="max-w-[80%] dark:max-w-[90%] max-md:max-w-full p-2 data-[self=false]:pb-3 relative backdrop-blur-md bg-clip-padding rounded-tl-2xl rounded-tr-2xl data-[self=true]:rounded-bl-2xl data-[self=false]:rounded-br-2xl shadow-lg dark:shadow-none bg-gradient-to-tr from-white/10 via-white/5 to-white/10 data-[self=true]:bg-gradient-to-tl data-[self=true]:from-white/5 data-[self=true]:via-white/[3%] data-[self=true]:to-white/5 dark:bg-none dark:data-[self=true]:bg-[#2A2A2A] dark:rounded-lg dark:data-[self=true]:rounded-bl-lg dark:data-[self=false]:rounded-br-lg">
              <template v-if="getParts(message).length" v-for="part of getParts(message)">
                <div v-if="typeof part === 'string'" v-html="parseMarkdown(part, false)" class="markdown-content" />
                <div v-else>
                  <button
                    class="inline-flex items-center space-x-1 rounded-lg p-1 text-sm bg-white/15 dark:bg-vue-black-mute cursor-pointer"
                    @click="unfoldedTools.includes(part.id) ? unfoldedTools = unfoldedTools.filter(v => v !== part.id) : unfoldedTools.push(part.id)">
                    <component :is="toolIcons[part.name] ?? toolIcons.default" class="w-4 h-4" />
                    <div class="inline-flex items-center space-x-3 select-none">
                      <p>{{ capitalize(part.name) }}</p>
                      <LoaderCircleIcon class="w-4 h-4 animate-spin" v-if="!('result' in part)" />
                      <ChevronUpIcon v-else-if="part.result" :data-folded="!unfoldedTools.includes(part.id)"
                        class="w-4 h-4 data-[folded=true]:rotate-180 transition-all duration-100 ease-in-out" />
                      <CheckIcon v-else class="w-4 h-4 text-green-500" />
                    </div>
                  </button>
                  <div v-if="unfoldedTools.includes(part.id) && 'result' in part"
                    class="mt-1 border-l-2 border-white/30 pl-2 break-words text-sm">
                    <p class="mb-1">{{ JSON.stringify(part.args) }}</p>
                    <template v-if="part.result">
                      <template v-if="['scrape', 'search', 'repo_tree'].includes(part.name)">
                        <!-- Scrape tool -->
                        <div v-if="part.name === 'scrape' && typeof part.result === 'object'">
                          <div v-if="!(part.result.success ?? false)"
                            class="inline-flex items-center space-x-2 text-red-500">
                            <CircleAlertIcon class="w-4 h-4" />
                            <p>{{ part.result.error }}</p>
                          </div>
                          <div v-else v-html="parseMarkdown(part.result.markdown)" class="markdown-content" />
                        </div>
                        <!-- Search tool -->
                        <div v-if="part.name === 'search' && typeof part.result === 'object'">
                          <div v-if="!(part.result.success ?? true)"
                            class="inline-flex items-center space-x-2 text-red-500">
                            <CircleAlertIcon class="w-4 h-4" />
                            <p>{{ part.result.error }}</p>
                          </div>
                          <div v-else class="flex flex-col space-y-2">
                            <div v-if="part.result.zci" class="border-y border-y-white/30 p-2">
                              <a class="text-xl font-bold hover:underline" :href="part.result.zci.url">{{
                                part.result.zci.title }}</a>
                              <p>{{ part.result.zci.text }}</p>
                            </div>
                            <div v-for="result in part.result.results" class="inline-flex flex-col">
                              <div class="inline-block">
                                <a class="text-lg text-sky-400 hover:underline dark:text-blue-500 -mb-1"
                                  :href="result.url">{{
                                  result.title }}</a>
                              </div>
                              <div class="inline-block">
                                <a class="hover:underline text-emerald-400" :href="result.url">{{ result.url }}</a>
                              </div>
                              <p>{{ result.snippet }}</p>
                            </div>
                          </div>
                        </div>
                        <!-- Repo Tree tool -->
                        <div v-if="part.name === 'repo_tree' && typeof part.result === 'string'">
                          <pre>{{ part.result }}</pre>
                        </div>
                      </template>
                      <pre v-else><code class="hljs">{{ objectToString(part.result).trim() }}</code></pre>
                    </template>
                    <div v-else class="text-white/75">Tool didn't return any data</div>
                  </div>
                </div>
              </template>
              <div v-else-if="message.role !== 'user' || !message.attachmentIds?.length"
                class="flex items-center justify-center">
                <Loader />
              </div>
              <div v-if="message.role === 'assistant' && !errorMessageRegex.test(getContent(message))"
                class="flex p-0.5 rounded-md light:bg-white/15 backdrop-blur-sm absolute -bottom-3 dark:-bottom-5 left-1 light:shadow-md dark:space-x-1.5">
                <button v-tooltip="'Copy'" @click="copyToClipboard(getContent(message))"
                  class="hover:bg-white/5 transition p-1 rounded-md">
                  <CopyIcon class="w-3 h-3 dark:w-5 dark:h-5" />
                </button>
                <button v-tooltip="'Regenerate'" @click="() => { /*TODO*/ }"
                  class="hover:bg-white/5 transition p-1 rounded-md">
                  <RefreshCwIcon class="w-3 h-3 dark:w-5 dark:h-5 transition-all duration-500 hover:rotate-180" />
                </button>
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
        <Loader />
      </div>
      <div class="text-center" v-else>
        <h1 class="text-2xl font-bold">An error occurred</h1>
        <h2>{{ messages.error }}</h2>
      </div>
    </div>

    <ErrorPopup :show="showError" :error="error" />
    <!-- Input Area -->
    <div class="absolute bottom-4 left-4 right-4 z-10 pointer-events-none"
      @drop.prevent="upload($event.dataTransfer?.files)">
      <div
        class="flex flex-col items-start max-w-2xl mx-auto bg-gradient-to-br from-vue-black/30 via-vue-black-soft/20 to-vue-black/30 dark:bg-none dark:bg-vue-black backdrop-blur-md rounded-xl p-2 shadow-lg pointer-events-auto">
        <div v-if="uploads.length" class="flex">
          <div v-for="file in uploads" class="relative">
            <button class="absolute -top-1.5 right-0 rounded-full bg-vue-black/75 p-[1px]"
              @click="uploads = uploads.filter(f => f.hash !== file.hash)">
              <XIcon class="w-4 h-4" />
            </button>
            <img v-if="file.image" :key="file.hash" :src="file.href"
              :data-disabled="!modelInfo[model].capabilities.includes('imageInput')"
              class="w-12 h-12 rounded-lg mr-2 overflow-hidden data-[disabled=true]:grayscale" alt="File" />
          </div>
        </div>
        <textarea v-model="input" @keydown="handleKeyDown" placeholder="Type a message..."
          class="bg-transparent p-1 focus:outline-none w-full resize-none min-h-[4rem] max-h-[10rem] overflow-y-auto"
          rows="2" />
        <div class="flex justify-between w-full text-white/75 items-end">
          <input type="file" multiple accept="image/*" class="hidden" id="file"
            @change.prevent="upload(($event.target as HTMLInputElement)?.files ?? undefined)"
            :disabled="!modelInfo[model].capabilities.includes('imageInput')">
          <div class="flex p-1">
            <ModelSelector v-model="model" />
          </div>
          <div class="flex items-center">
            <label :aria-disabled="!modelInfo[model].capabilities.includes('imageInput')"
              class="p-2 rounded-full aria-[disabled=false]:hover:bg-white/5 transition mt-1 aria-[disabled=false]:cursor-pointer aria-[disabled=true]:text-white/25"
              :title="modelInfo[model].capabilities.includes('imageInput') ? 'Upload File' : 'This model does not support file input'"
              for="file">
              <PaperclipIcon class="w-5 h-5" />
            </label>
            <button
              v-if="(messages.array[messages.array.length - 1] as Extract<Message, { role: 'assistant' }>)?.finished ?? true"
              @click="sendMessage" class="p-2 rounded-full hover:bg-white/5 transition mt-1">
              <SendIcon class="w-5 h-5" />
            </button>
            <button v-else @click="abortController.abort()" class="p-2 rounded-full hover:bg-white/5 transition mt-1">
              <CircleStopIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import "floating-vue/dist/style.css";
import "highlight.js/styles/github-dark.min.css";

import { ref, onMounted, watch, type Ref, type FunctionalComponent, nextTick } from "vue";
import {
  SendIcon,
  PaperclipIcon,
  CircleStopIcon,
  XIcon,
  CopyIcon,
  type LucideProps,
  SunIcon,
  SearchIcon,
  GlobeIcon,
  FolderTreeIcon,
  FileDiffIcon,
  HammerIcon,
  LoaderCircleIcon,
  ChevronUpIcon,
  CheckIcon,
  RefreshCwIcon,
  CircleAlertIcon,
} from "lucide-vue-next";
import { Marked, Renderer } from "marked";
import { markedHighlight } from "marked-highlight";
import markedKatex from "marked-katex-extension";
import hljs from "highlight.js";
import DOMPurify from "dompurify";
import { calculateHash, capitalize, isBackendAlive, omit } from "@/lib/utils.ts";
import type { MessageSchema } from "../../shared/schemas.ts";
import { onBeforeRouteUpdate, useRoute } from "vue-router";
import { MessageChunkSchema, routes, SSESchema } from "../../shared/schemas.ts";
import { useConversationStore } from "@/stores/conversations.ts";
import { errorMessageRegex, modelInfo } from "../../shared/constants.ts";
import ModelSelector from "@/components/model-selector.vue";
import router from "@/router";
import { useModelStore } from "@/stores/models.ts";
import type { Conversation } from "@/lib/types.ts";
import Loader from "@/components/loader.vue";
import { z } from "zod";
import ErrorPopup from "@/components/error-popup.vue";

type FileData = Omit<z.infer<(typeof routes["upload"])>[0], "id"> & { id?: string, href: string }

const route = useRoute();
const conversationStore = useConversationStore();
const modelStore = useModelStore();

type Message =
  | Extract<z.infer<typeof MessageSchema>, { role: "user" }>
  | (Extract<z.infer<typeof MessageSchema>, {
    role: "assistant"
  }> & { finished: boolean });
const messages = ref<{ loading: boolean, error: string | null, array: Message[] }>({
  loading: true,
  error: null,
  array: [],
});
const conversation = ref<Conversation | null>(conversationStore.conversations.find((c) => c.id === route.params.id) ?? null);
const input = ref("");
const uploads = ref<FileData[]>([]);
const error = ref<Omit<Extract<z.infer<typeof SSESchema>, { kind: "error" }>, "kind" | "for"> | null>(null);
const showError = ref(false);
const abortController = new AbortController();
const unfoldedTools = ref<FullToolCall["id"][]>([]);

const toolIcons = {
  weather: SunIcon,
  scrape: GlobeIcon,
  search: SearchIcon,
  repo_tree: FolderTreeIcon,
  repo_file: FileDiffIcon,
  default: HammerIcon
} satisfies Record<string, FunctionalComponent<LucideProps, {}, any, {}>>;

function showErrorPopup(err: NonNullable<typeof error extends Ref<infer U> ? U : never>) {
  error.value = err;
  showError.value = true;

  const msPerWord = 500;

  setTimeout(() => {
    showError.value = false;
  }, err.message.split(" ").length * msPerWord);
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

async function upload(fileList: FileList | undefined) {
  if (!fileList?.length || !modelInfo[model.value].capabilities.includes("imageInput")) {
    return;
  }

  const files = Array.from<File>(fileList);
  const fileData = (await Promise.all(
    files.map<Promise<FileData>>(
      async file => ({
        hash: (await calculateHash(await file.arrayBuffer())).hex,
        href: URL.createObjectURL(file),
        image: file.type.startsWith("image/"),
      }),
    ),
  )).filter(f => !uploads.value.find(u => u.hash === f.hash));

  if (!fileData.length) {
    return;
  }

  uploads.value.push(...fileData);
  const formData = new FormData();
  files.forEach(file => formData.append("file", file));

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    console.log("Failed to upload files");
    uploads.value = uploads.value.filter(file => !fileData.find(f => f.hash === file.hash));
    return;
  }

  const result = routes["upload"].safeParse(await res.json());
  if (result.success) {
    uploads.value.forEach(file => {
      const data = result.data.find(f => f.hash === file.hash);
      if (data) {
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
watch(model, function (newValue, oldValue) {
  if (newValue !== oldValue && conversation.value && conversation.value.model !== newValue) {
    conversationStore.$modify({ id: conversation.value.id, model: newValue });
  }
});

async function init(id: string) {
  const isNew = id === "new";

  messages.value = { loading: !isNew, error: null, array: [] };
  const c = conversationStore.conversations.find(c => c.id === id) ?? null;
  conversation.value = c;
  model.value = c?.model ?? modelStore.models[0];
  error.value = null;
  showError.value = false;

  if (isNew) {
    return;
  }

  await fetchMessages(id);
}

async function fetchMessages(id: string) {
  try {
    const res = await fetch(`/api/${id}/messages`);
    if (!res.ok) {
      const alive = await isBackendAlive();
      if (!alive) throw new Error("Backend seems to be dead");
      throw new Error(res.statusText);
    }
    const result = routes["[id]"]["messages"].safeParse(await res.json());
    if (!result.success) throw new Error("Backend provided bogus data");
    messages.value = { loading: false, error: null, array: result.data.map((msg) => ({ ...msg, finished: true })) };
  } catch (e) {
    if (e instanceof Error) {
      messages.value = { loading: false, error: e.message, array: [] };
    }
  }
}

let skipNextInit = false;

onBeforeRouteUpdate(async (to, from, next) => {
  console.log("Route update", to.params.id, from.params.id);
  if (to.params.id !== from.params.id) {
    if (skipNextInit) {
      skipNextInit = false;
      return next();
    }
    console.log("init(" + to.params.id + ")");
    await init(to.params.id as string);
  }
  return next();
});

onMounted(async () => {
  await init(route.params.id as string);

  function setupSSE() {
    const sse = new EventSource("/api/sse");

    sse.onmessage = (e) => {
      const data = JSON.parse(e.data);
      const { data: msg } = SSESchema.safeParse(data);
      if (msg?.kind === "rename") {
        conversationStore.$modify({ id: msg.for, requestChange: false, name: msg.newName });
      }

      if (msg?.kind === "error" && msg?.for === route.params.id) {
        console.error(msg.title + ": ", msg.message);
        showErrorPopup(msg);
      }
    };

    sse.onerror = (e) => {
      console.error("SSE connection error:", e);
      sse.close();
      setTimeout(setupSSE, 1000);
    };
  }

  setupSSE();
});

function objectToString(obj: unknown, indent = ''): string {
  if (obj === null || obj === undefined) {
    return String(obj);
  }

  if (typeof obj === "string") {
    return obj;
  }

  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';

      const items = obj.map(item => {
        if (Array.isArray(item) || (typeof item === 'object' && item !== null)) {
          return `${indent}  ${objectToString(item, indent + '  ')}`;
        }
        return `${indent}  ${String(item)}`;
      });

      return `[\n${items.join(',\n')}\n${indent}]`;
    }

    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return '{}';

    return entries
      .map(([key, value]) => {
        if (value === null || value === undefined) {
          return `${indent}${key}: ${String(value)}`;
        }
        if (typeof value === "object") {
          if (Array.isArray(value)) {
            return `${indent}${key}: ${objectToString(value, indent + '  ')}`;
          }
          return `${indent}${key}: {\n${Object.entries(value as Record<string, unknown>)
            .map(([k, v]) => {
              if (typeof v === 'object' && v !== null) {
                return `${indent}  ${k}: ${objectToString(v, indent + '  ')}`;
              }
              return `${indent}  ${k}: ${String(v)}`;
            })
            .join(',\n')}\n${indent}}`;
        }
        return `${indent}${key}: ${value}`;
      })
      .join(',\n');
  }

  return String(obj);
}

function getContent(msg: Message) {
  return "content" in msg
    ? msg.content
    : msg.chunks.filter(v => v.type === "text-delta").map((v) => v.textDelta).join("");
}

interface InitialToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

type FullToolCall = InitialToolCall & { result: any };

function getParts(msg: Message) {
  const parts: (InitialToolCall | FullToolCall | string)[] = [];

  if (msg.role === "user") {
    return [msg.content] as typeof parts;
  }

  for (const chunk of msg.chunks) {
    const last = parts[parts.length - 1];

    if (chunk.type === "text-delta") {
      if (typeof last === "string") {
        parts[parts.length - 1] = last + chunk.textDelta;
      } else {
        parts.push(chunk.textDelta);
      }
    } else {
      if (chunk.type === "tool-call") {
        parts.push({ id: chunk.toolCallId, name: chunk.toolName, args: chunk.args });
      } else if (typeof last === "object" && "id" in last && last.id === chunk.toolCallId) {
        parts[parts.length - 1] = {
          ...last,
          result: chunk.result
        };
      }
    }
  }

  return parts;
}

async function sendMessage() {
  if (messages.value.array[messages.value.array.length - 1]?.role === "user") {
    return;
  }

  const content = input.value.trim();
  if (content || uploads.value.length) {
    let id: string = route.params.id as string;

    if (route.params.id === "new") {
      const c = await conversationStore.$create({ model: model.value });
      id = c.id;
      skipNextInit = true;
      await router.push({ name: "c", params: { id } });
    }

    const attachments = modelInfo[model.value].capabilities.includes("imageInput")
      ? uploads.value.filter(f => !!f.id) as { id: string, image: boolean }[]
      : undefined;

    messages.value.array.push({
      role: "user",
      content,
    }, {
      role: "assistant",
      chunks: [],
      author: model.value,
      finished: false,
    });

    input.value = "";
    if (attachments) uploads.value = [];

    const res = await fetch(`/api/${id}/completion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: content, model: model.value }),
    });

    const msg = messages.value.array[messages.value.array.length - 1] as Extract<Message, { role: "assistant" }>;

    const decoder = new TextDecoder();
    for await (const chunk of res.body! as ReadableStream<Uint8Array> & AsyncIterable<Uint8Array>) {
      const text = decoder.decode(chunk);
      const parts = text.trim().split("\n");
      for (const part of parts) {
        if (part.trim()) {
          try {
            const json = JSON.parse(part);
            const { data: chunk } = MessageChunkSchema.safeParse(json);
            if (chunk) msg.chunks.push(chunk);
          } catch (e) {
            console.warn("Failed to parse chunk:", part);
          }
        }
      }
    }
    msg.finished = true;
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
  autoResize(e.target as HTMLTextAreaElement);
}

function autoResize(textarea: HTMLTextAreaElement) {
  textarea.style.height = '4rem'; // Reset height to min (2 rows)
  const scrollHeight = textarea.scrollHeight;
  textarea.style.height = Math.min(scrollHeight, 160) + 'px'; // 160px = 10rem
}

// Watch for input changes to handle paste events and other modifications
watch(input, () => {
  nextTick(() => {
    const textarea = document.querySelector('textarea');
    if (textarea) autoResize(textarea);
  });
});

// ---
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
  }),
);

const renderer = new Renderer();

renderer.blockquote = function ({ text, raw }) {
  const match = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|ERROR)]/);
  if (match) {
    const type = match[1].toLowerCase();
    const title = capitalize(type);
    return `<blockquote data-type="${type}">${text
      .replace(match[0], title)
      .split("\n")
      .filter(Boolean)
      .map(v => {
        const isTitle = v === title;
        return `<p${isTitle ? " class=\"callout-title\"" : ""}>${isTitle ? v : stock.parse(v, { async: false })}</p>`;
      })
      .join("\n")
      }</blockquote>`;
  }
  return stock.parse(raw, { async: false });
};

marked.use({ renderer });
marked.use(markedKatex({ throwOnError: false, nonStandard: true, output: "mathml" }));

// ---

const markdownCache = new Map<string, string>();

function parseMarkdown(text: string, strict = true) {
  if (markdownCache.has(text)) {
    return markdownCache.get(text);
  }

  const parsed = DOMPurify.sanitize(
    marked.parse(
      text.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ""),
      {
        async: false,
        breaks: true,
        gfm: true,
      },
    ),
    strict
      ? {}
      : {
        ADD_ATTR: ["onclick"]
      }
  );

  markdownCache.set(text, parsed);
  return parsed;
}
</script>

<style lang="sass">
.markdown-content
  @apply break-words

  a
    @apply text-sky-400 hover:underline dark:text-blue-500

  pre:not(:has(code.hljs))
    @apply rounded overflow-x-auto

  code
    @apply font-monaspace_neon

  // \`\`\`\n<content>\n\`\`\`
  pre:has(code.hljs)
    @apply shadow-md dark:shadow-none backdrop-blur-sm text-sm mb-2 rounded-b-md overflow-x-auto max-w-full
    &:last-child
      @apply mb-0
    code
      @apply block p-2 rounded-b-md whitespace-pre-wrap break-all

  strong
    @apply font-bold

  em
    @apply italic

  // `<content>`
  code:not(.hljs)
    @apply bg-white/[2%] dark:bg-[#0D1117] backdrop-blur-sm rounded p-1 text-sm

  // # <content>
  h1
    @apply text-3xl font-bold mt-2 mb-2

  // ## <content>
  h2
    @apply text-2xl font-bold mt-2 mb-2

  // ### <content>
  h3
    @apply text-xl font-bold mt-2 mb-2

  // #### <content>
  h4
    @apply text-lg font-bold mt-2 mb-2

  // <i>. <content>
  ol
    @apply list-decimal list-outside ml-6 my-1
    & ol, & ul
      @apply mt-2 mb-2

  // - <content>
  ul
    @apply list-disc list-outside ml-6 my-1
    & ul, & ol
      @apply mt-2 mb-2

  // Nested list items
  li
    @apply mb-1
    & > ul, & > ol
      @apply ml-4

  hr
    @apply border-t border-white/30 my-4

  // Blockquote
  blockquote
    @apply border-l-4 border-white/30 p-1 pl-3 italic bg-white/5 rounded
    &:not(:last-child)
      @apply mb-4

    &:not(:first-child)
      @apply mt-4

    &[data-type="note"],
    &[data-type="tip"],
    &[data-type="important"],
    &[data-type="warning"],
    &[data-type="caution"],
    &[data-type="error"]
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

    &[data-type="caution"],
    &[data-type="error"]
      @apply border-red-500
      .callout-title
        @apply text-red-500

  // Table
  table
    @apply w-full border-collapse my-4
    th, td
      @apply border border-white/30 p-2

    th
      @apply bg-white/10 font-bold

    tr:nth-child(even)
      @apply bg-white/5

.hljs
  @apply bg-white/5 dark:bg-[#0d1117]

.hljs-comment
  @apply font-monaspace_radon text-gray-300/75 italic

.hljs-header
  @apply bg-white/5 dark:bg-vue-black-mute rounded-t-xl flex items-center justify-between py-2 px-3 text-sm mt-1

.v-popper--theme-tooltip
  .v-popper__inner
    @apply bg-white/15 backdrop-blur-md dark:bg-vue-black-tooltip dark:border-[1px] dark:border-[#847A6C]

  .v-popper__arrow-outer
    @apply hidden

@media (prefers-color-scheme: light)
  .v-popper__popper
    transition: none !important

    *
      transition: none !important
</style>