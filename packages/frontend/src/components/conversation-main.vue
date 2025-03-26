<template>
  <!-- Chat Area -->
  <div class="flex-1 flex flex-col relative">
    <!-- Chat Messages -->
    <div
      v-if="!messages.loading && !messages.error && messages.array.length"
      class="flex-1 overflow-y-auto p-4 pb-36 overflow-x-hidden"
    >
      <div class="max-w-5xl mx-auto">
        <div v-for="(message, i) in messages.array" :key="i" class="mb-2 relative">
          <div
            :data-self="message.role === 'user'"
            class="flex justify-start data-[self=true]:justify-end items-end dark:items-start space-x-2"
          >
            <img
              v-if="message.role === 'assistant'"
              class="w-6 h-6 dark:mt-2 max-md:hidden"
              :alt="message.author"
              :src="models[message.author].logoSrc"
              width="24"
              v-tooltip="{ content: models[message.author].name, placement: 'left' }"
            />
            <div
              :data-self="message.role === 'user'"
              class="max-w-[80%] dark:max-w-[90%] max-md:max-w-full p-2 data-[self=false]:pb-3 relative backdrop-blur-md bg-clip-padding rounded-tl-2xl rounded-tr-2xl data-[self=true]:rounded-bl-2xl data-[self=false]:rounded-br-2xl shadow-lg dark:shadow-none bg-gradient-to-tr from-white/10 via-white/5 to-white/10 data-[self=true]:bg-gradient-to-tl data-[self=true]:from-white/5 data-[self=true]:via-white/[3%] data-[self=true]:to-white/5 dark:bg-none dark:data-[self=true]:bg-[#2A2A2A] dark:rounded-lg dark:data-[self=true]:rounded-bl-lg dark:data-[self=false]:rounded-br-lg"
            >
              <template v-if="getParts(message).length">
                <template v-for="(part, partIndex) of getParts(message)">
                  <div
                    v-if="typeof part === 'string'"
                    v-html="parseMarkdown(part, false)"
                    class="markdown-content"
                    v-bind:key="`str@${partIndex}`"
                  />
                  <div v-else class="m-1 ml-0" v-bind:key="partIndex">
                    <button
                      class="inline-flex items-center space-x-1 rounded-lg p-1 text-sm bg-white/15 dark:bg-vue-black-mute cursor-pointer"
                      @click="
                        unfoldedTools.includes(part.id)
                          ? (unfoldedTools = unfoldedTools.filter(v => v !== part.id))
                          : unfoldedTools.push(part.id)
                      "
                    >
                      <component :is="toolIcons[part.name] ?? toolIcons.default" class="w-4 h-4" />
                      <div class="inline-flex items-center space-x-3 select-none">
                        <p>{{ capitalize(part.name) }}</p>
                        <LoaderCircleIcon class="w-4 h-4 animate-spin" v-if="!('result' in part)" />
                        <ChevronUpIcon
                          v-else-if="part.result"
                          :data-folded="!unfoldedTools.includes(part.id)"
                          class="w-4 h-4 data-[folded=true]:rotate-180 transition-all duration-100 ease-in-out"
                        />
                        <CheckIcon v-else class="w-4 h-4 text-green-500" />
                      </div>
                    </button>
                    <div
                      v-if="unfoldedTools.includes(part.id) && 'result' in part"
                      class="mt-1 border-l-2 border-white/30 pl-2 break-words text-sm"
                    >
                      <p class="mb-1">{{ JSON.stringify(part.args) }}</p>
                      <ToolResult v-if="part.result" :tool="part" />
                      <div v-else class="text-white/75">Tool didn't return any data</div>
                    </div>
                  </div>
                </template>
              </template>
              <div v-else-if="!finished(message)" class="flex items-center justify-center p-2">
                <Loader />
              </div>
              <Transition
                enter-active-class="transition-all duration-300 ease-in-out"
                enter-from-class="-translate-x-4 opacity-0"
                enter-to-class="translate-x-0 opacity-100"
              >
                <div
                  v-if="
                    /* show only if message is by assistant and is finished, or is by assistant and isn't finished, but the abort controller isn't present */
                    message.role === 'assistant' &&
                    (finished(message) || (!finished(message) && !abortController))
                  "
                  class="flex p-0.5 dark:pl-0 rounded-md light:bg-white/15 backdrop-blur-sm light:absolute light:-bottom-3 light:left-1 light:shadow-md dark:space-x-1.5"
                >
                  <button
                    v-if="finished(message)"
                    v-tooltip="'Copy'"
                    @click="copyToClipboard(getContent(message))"
                    class="hover:bg-white/5 transition p-1 rounded-md"
                  >
                    <CopyIcon class="w-3 h-3 dark:w-5 dark:h-5" />
                  </button>
                  <button
                    v-if="lastMessage === message"
                    v-tooltip="'Regenerate'"
                    @click="regenerateLastMessage"
                    class="hover:bg-white/5 transition p-1 rounded-md group"
                  >
                    <RefreshCwIcon
                      class="w-3 h-3 dark:w-5 dark:h-5 transition-all duration-500 group-hover:rotate-[360deg]"
                    />
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex-1 flex items-center justify-center">
      <div
        class="text-center"
        v-if="!messages.loading && !messages.error && !messages.array.length"
      >
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
    <div
      class="absolute bottom-4 left-4 right-4 z-10 pointer-events-none"
      @drop.prevent="upload($event.dataTransfer?.files)"
    >
      <div
        class="flex flex-col items-start max-w-2xl mx-auto bg-gradient-to-br from-vue-black/30 via-vue-black-soft/20 to-vue-black/30 dark:bg-none dark:bg-vue-black backdrop-blur-md rounded-xl p-2 shadow-lg pointer-events-auto"
      >
        <div v-if="uploads.length" class="flex">
          <div v-for="file in uploads" class="relative" v-bind:key="file.hash">
            <button
              class="absolute -top-1.5 right-0 rounded-full bg-vue-black/75 p-[1px]"
              @click="uploads = uploads.filter(f => f.hash !== file.hash)"
            >
              <XIcon class="w-4 h-4" />
            </button>
            <img
              v-if="file.image"
              :key="file.hash"
              :src="file.href"
              :data-disabled="!models[model].capabilities.includes('imageInput')"
              class="w-12 h-12 rounded-lg mr-2 overflow-hidden data-[disabled=true]:grayscale"
              alt="File"
            />
          </div>
        </div>
        <textarea
          v-model="input"
          @keydown="handleKeyDown"
          placeholder="Type a message..."
          class="bg-transparent p-1 focus:outline-none w-full resize-none min-h-[4rem] max-h-[10rem] overflow-y-auto"
          rows="2"
        />
        <div class="flex justify-between w-full text-white/75 items-end">
          <input
            type="file"
            multiple
            accept="image/*"
            class="hidden"
            id="file"
            @change.prevent="upload(($event.target as HTMLInputElement)?.files ?? undefined)"
            :disabled="!models[model].capabilities.includes('imageInput')"
          />
          <div class="flex p-1">
            <ModelSelector v-model="model" />
          </div>
          <div class="flex items-center">
            <label
              :aria-disabled="!models[model].capabilities.includes('imageInput')"
              class="p-2 rounded-full aria-[disabled=false]:hover:bg-white/5 transition mt-1 aria-[disabled=false]:cursor-pointer aria-[disabled=true]:text-white/25"
              :title="
                models[model].capabilities.includes('imageInput')
                  ? 'Upload File'
                  : 'This model does not support file input'
              "
              for="file"
            >
              <PaperclipIcon class="w-5 h-5" />
            </label>
            <button
              v-if="!abortController"
              @click="sendMessage"
              class="p-2 rounded-full hover:bg-white/5 transition mt-1"
            >
              <SendIcon class="w-5 h-5" />
            </button>
            <button
              v-else
              @click="
                abortController.abort();
                (messages.array[messages.array.length - 1] as AssistantMessage).chunks.push(null);
                abortController = null;
              "
              class="p-2 rounded-full hover:bg-white/5 transition mt-1"
            >
              <CircleStopIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import 'floating-vue/dist/style.css';
import 'highlight.js/styles/github-dark.min.css';

import ErrorPopup from '@/components/error-popup.vue';
import Loader from '@/components/loader.vue';
import ModelSelector from '@/components/model-selector.vue';
import ToolResult from '@/components/tool-result.vue';
import { parseMarkdown } from '@/lib/markdown.ts';
import type { Conversation, Nullish } from '@/lib/types.ts';
import { calculateHash, capitalize, isBackendAlive, safeParse } from '@/lib/utils.ts';
import router from '@/router';
import { useConversationStore } from '@/stores/conversations.ts';
import { useModelStore } from '@/stores/models.ts';
import { type } from 'arktype';
import { Message, MessageChunk, models, routes, SSE, type Model } from 'common';
import {
  CheckIcon,
  ChevronUpIcon,
  CircleStopIcon,
  CopyIcon,
  FileDiffIcon,
  FolderTreeIcon,
  GlobeIcon,
  HammerIcon,
  LoaderCircleIcon,
  PaperclipIcon,
  RefreshCwIcon,
  SearchIcon,
  SendIcon,
  SunIcon,
  XIcon,
  type LucideProps
} from 'lucide-vue-next';
import { computed, nextTick, onMounted, ref, watch, type FunctionalComponent, type Ref } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';

type FileData = Omit<(typeof routes.upload.infer)[0], 'id'> & { id?: string; href: string };
type AssistantMessage = Extract<typeof Message.infer, { role: 'assistant' }>;

const route = useRoute();
const conversationStore = useConversationStore();
const modelStore = useModelStore();

const messages = ref<{ loading: boolean; error: string | null; array: (typeof Message.infer)[] }>({
  loading: true,
  error: null,
  array: []
});
const conversation = ref<Conversation | null>(
  conversationStore.conversations.find(c => c.id === route.params.id) ?? null
);
const input = ref('');
const uploads = ref<FileData[]>([]);
const error = ref<Omit<Extract<typeof SSE.infer, { kind: 'error' }>, 'kind' | 'for'> | null>(null);
const showError = ref(false);
const abortController = ref<AbortController | null>(null);
const unfoldedTools = ref<FullToolCall['id'][]>([]);
const lastMessage = computed(() => messages.value.array?.at(-1) ?? null);

// eslint-disable-next-line
const toolIcons: Record<string, FunctionalComponent<LucideProps, {}, any, {}>> = {
  weather: SunIcon,
  scrape: GlobeIcon,
  search: SearchIcon,
  repo_tree: FolderTreeIcon,
  repo_file: FileDiffIcon,
  default: HammerIcon
};

function showErrorPopup(err: NonNullable<typeof error extends Ref<infer U> ? U : never>) {
  error.value = err;
  showError.value = true;

  const msPerWord = 500;

  setTimeout(
    () => {
      showError.value = false;
    },
    err.message.split(' ').length * msPerWord
  );
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

async function upload(fileList: FileList | undefined) {
  if (!fileList?.length || !models[model.value].capabilities.includes('imageInput')) {
    return;
  }

  const files = Array.from<File>(fileList);
  const fileData = (
    await Promise.all(
      files.map<Promise<FileData>>(async file => ({
        hash: (await calculateHash(await file.arrayBuffer())).hex,
        href: URL.createObjectURL(file),
        image: file.type.startsWith('image/')
      }))
    )
  ).filter(f => !uploads.value.find(u => u.hash === f.hash));

  if (!fileData.length) {
    return;
  }

  uploads.value.push(...fileData);
  const formData = new FormData();
  files.forEach(file => formData.append('file', file));

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    console.log('Failed to upload files');
    uploads.value = uploads.value.filter(file => !fileData.find(f => f.hash === file.hash));
    return;
  }

  const out = routes['upload'](await res.json());
  if (!(out instanceof type.errors)) {
    uploads.value.forEach(file => {
      const data = out.find(f => f.hash === file.hash);
      if (data) {
        file.id = data.id;
        URL.revokeObjectURL(file.href);
        file.href = '/api/upload/' + data.id;
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

function init(id: string) {
  const isNew = id === 'new';

  messages.value = { loading: false, error: null, array: [] };
  const c = conversationStore.conversations.find(c => c.id === id) ?? null;
  conversation.value = c;
  model.value = c?.model ?? modelStore.models[0];
  error.value = null;
  showError.value = false;

  if (isNew) {
    return;
  }

  fetchMessages(id);
}

function fetchMessages(id: string) {
  function equals(a: typeof Message.infer, b: typeof Message.infer) {
    if (a.role !== b.role) return false;

    if (a.role === 'user') {
      return a.content === (b as typeof a).content;
    }

    return (
      a.chunks.length === (b as typeof a).chunks.length &&
      a.chunks.every((v, i) => v === (b as typeof a).chunks[i])
    );
  }

  fetch(`/api/${id}/messages`)
    .then(res => {
      messages.value.loading = false;

      if (!res.ok) {
        return isBackendAlive().then(alive => {
          if (!alive) return (messages.value.error = 'Backend seems to be dead');
          messages.value.error = res.statusText;
        });
      }

      res.json().then(data => {
        const out = routes['[id]']['messages'](data);
        if (!(out instanceof type.errors)) {
          if (messages.value.array.length > out.length) {
            const lastIndex = out.length - 1;
            const local = messages.value.array[lastIndex];
            const remote = out[lastIndex];
            // if both messages are the same and the last message is not finished, don't update
            if (equals(local, remote) && !finished(messages.value.array.at(-1))) return;
          }

          messages.value.array = out;
          localStorage.setItem(id, JSON.stringify(out));
        } else {
          messages.value.error = 'Backend provided bogus data';
        }
      });
    })
    .catch(e => {
      messages.value.loading = false;
      messages.value.error = e.message;
    });

  const out = Message.array()(safeParse(localStorage.getItem(id)));
  if (!(out instanceof type.errors)) {
    messages.value.array = out;
    return (messages.value.loading = false);
  }

  messages.value.loading = true;
}

let skipNextInit = false;

onBeforeRouteUpdate((to, from, next) => {
  console.log('Route update', to.params.id, from.params.id);
  if (to.params.id !== from.params.id) {
    if (skipNextInit) {
      skipNextInit = false;
      return next();
    }
    console.log('init(' + to.params.id + ')');
    init(to.params.id as string);
  }
  return next();
});

onMounted(() => {
  init(route.params.id as string);

  function setupSSE() {
    const sse = new EventSource('/api/sse');

    sse.onmessage = e => {
      const data = JSON.parse(e.data);
      const msg = SSE(data);
      if (msg instanceof type.errors) {
        return;
      }
      if (msg?.kind === 'rename') {
        conversationStore.$modify({ id: msg.for, requestChange: false, name: msg.newName });
      }

      if (msg?.kind === 'error' && msg?.for === route.params.id) {
        console.error(msg.title + ': ', msg.message);
        showErrorPopup(msg);
      }
    };

    sse.onerror = e => {
      console.error('SSE connection error:', e);
      sse.close();
      setTimeout(setupSSE, 1000);
    };
  }

  setupSSE();
});

function getContent(msg: typeof Message.infer) {
  return 'content' in msg
    ? msg.content
    : msg.chunks
        .filter(
          (v): v is Extract<typeof MessageChunk.infer, { type: 'text-delta' }> =>
            v?.type === 'text-delta'
        )
        .map(v => v.textDelta)
        .join('');
}

interface InitialToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

type FullToolCall = InitialToolCall & { result: unknown };

function getParts(msg: typeof Message.infer) {
  const parts: (InitialToolCall | FullToolCall | string)[] = [];

  if (msg.role === 'user') {
    return [msg.content] as typeof parts;
  }

  for (const chunk of msg.chunks) {
    if (!chunk) continue;
    const last = parts.at(-1);

    switch (chunk.type) {
      case 'text-delta':
        if (typeof last === 'string') {
          parts[parts.length - 1] = last + chunk.textDelta;
        } else {
          parts.push(chunk.textDelta);
        }
        break;
      case 'tool-call':
        parts.push({ id: chunk.toolCallId, name: chunk.toolName, args: chunk.args });
        break;
      case 'reasoning':
        // TODO
        break;
      case 'tool-result':
        if (typeof last === 'object' && 'id' in last && last.id === chunk.toolCallId) {
          parts[parts.length - 1] = {
            ...last,
            result: chunk.result
          };
        }
        break;
    }
  }

  return parts;
}

async function sendMessage() {
  if (messages.value.array.at(-1)?.role === 'user') {
    return;
  }

  const content = input.value.trim();
  if (content || uploads.value.length) {
    let id: string = route.params.id as string;

    if (route.params.id === 'new') {
      const c = await conversationStore.$create({ model: model.value });
      id = c.id;
      skipNextInit = true;
      await router.push({ name: 'c', params: { id } });
    }

    const attachments = models[model.value].capabilities.includes('imageInput')
      ? (uploads.value.filter(f => !!f.id) as { id: string; image: boolean }[])
      : undefined;

    messages.value.array.push(
      {
        role: 'user',
        content
      },
      {
        role: 'assistant',
        chunks: [],
        author: model.value
      }
    );

    localStorage.setItem(id, JSON.stringify(messages.value.array));

    input.value = '';
    if (attachments) uploads.value = [];

    await requestCompletion({
      conversationId: id,
      message: content,
      model: model.value
    });
  }
}

/** Checks if the message ends with a null chunk */
function finished(msg: Nullish<typeof Message.infer>) {
  const u = undefined;
  return (msg ? ('chunks' in msg ? msg.chunks : u) : u)?.at(-1) === null;
}

interface CompletionOptions {
  conversationId?: string;
  message: string | null;
  model?: typeof Model.infer;
  attachmentIds?: string[];
}

async function requestCompletion({
  conversationId = route.params.id as string,
  ...opts
}: CompletionOptions) {
  abortController.value = new AbortController();
  const res = await fetch(`/api/${conversationId}/completion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(opts),
    signal: abortController.value.signal
  });

  let msg = messages.value.array.at(-1)!;
  if (msg.role === 'user' || finished(msg)) {
    const index =
      messages.value.array.push({
        role: 'assistant',
        chunks: [],
        author: model.value
      }) - 1;
    msg = messages.value.array[index] as AssistantMessage;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of res.body! as ReadableStream<Uint8Array> & AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk);
    const lastNewlineIndex = buffer.lastIndexOf('\n');
    if (lastNewlineIndex !== -1) {
      const completeChunks = buffer.slice(0, lastNewlineIndex);
      buffer = buffer.slice(lastNewlineIndex + 1);

      const parts = completeChunks.split('\n');
      for (const part of parts) {
        if (part.trim()) {
          try {
            const json = JSON.parse(part);
            const out = MessageChunk(json);
            if (!(out instanceof type.errors)) msg.chunks.push(out);
          } catch (e) {
            console.warn('Failed to parse chunk:', part, e);
          }
        }
      }
    }
  }
  // Handle any remaining data in buffer
  if (buffer.trim()) {
    try {
      const json = JSON.parse(buffer);
      const out = MessageChunk(json);
      if (!(out instanceof type.errors)) msg.chunks.push(out);
    } catch (e) {
      console.warn('Failed to parse chunk:', buffer, e);
    }
  }
  abortController.value = null;
  localStorage.setItem(conversationId, JSON.stringify(messages.value.array));
}

async function regenerateLastMessage() {
  const last = messages.value.array.at(-1);
  if (last?.role !== 'assistant') return;
  last.chunks = [];
  last.author = model.value;
  await requestCompletion({ message: null, model: model.value });
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
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
</script>

<style lang="sass">
.markdown-content
  @apply break-words

  a
    @apply text-sky-400 hover:underline dark:text-blue-500

  pre:not(:has(code.hljs))
    @apply rounded overflow-x-auto

  code
    @apply font-sf_mono

  // \`\`\`\n<content>\n\`\`\`
  pre:has(code.hljs)
    @apply backdrop-blur-sm text-sm overflow-x-auto max-w-full
    code
      @apply block p-2 whitespace-pre-wrap break-all

  strong
    @apply font-bold

  em
    @apply italic

  // `<content>`
  code:not(.hljs)
    @apply bg-white/[2%] dark:bg-[#101010] backdrop-blur-sm rounded px-1 py-0.5 text-sm

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
  @apply bg-white/5 dark:bg-[#101010] border-[2px] border-t-0 border-white/10 dark:border-[#303030] rounded-b-xl

.hljs-container
  @apply flex flex-col light:shadow-md rounded-b-xl
  &:not(:last-child)
    @apply mb-1
  &:not(:first-child)
    @apply mt-1

.hljs-header
  @apply bg-white/10 dark:bg-[#181818] flex items-center justify-between py-2 px-3 text-sm mt-1 border-[2px] border-b-0 border-white/10 dark:border-[#303030] rounded-t-xl

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
