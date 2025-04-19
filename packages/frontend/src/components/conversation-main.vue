<template>
  <!-- Chat Area -->
  <div class="relative flex flex-1 flex-col">
    <!-- Chat Messages -->
    <div
      v-if="!messages.loading && !messages.error && messages.array.length"
      class="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-28"
    >
      <div class="mx-auto max-w-5xl space-y-8">
        <div v-for="(message, i) in messages.array" :key="i" class="relative">
          <div
            :data-self="message.role === 'user'"
            class="flex items-start justify-start space-x-2 data-[self=true]:justify-end"
          >
            <div
              :data-self="message.role === 'user'"
              class="group relative max-w-[90%] rounded-lg border-[#a2d0e5] p-2 data-[self=true]:border data-[self=true]:bg-[#B3D6E6] data-[self=false]:pb-3 data-[self=true]:shadow-sm max-md:max-w-full dark:border-[#422f42] dark:data-[self=true]:bg-[#3E2A3E]"
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
                      class="dark:bg-vue-black-mute inline-flex cursor-pointer items-center space-x-1 rounded-lg bg-white/15 p-1 text-sm"
                      @click="
                        unfoldedTools.includes(part.id)
                          ? (unfoldedTools = unfoldedTools.filter(v => v !== part.id))
                          : unfoldedTools.push(part.id)
                      "
                    >
                      <component :is="toolIcons[part.name] ?? toolIcons.default" class="h-4 w-4" />
                      <div class="inline-flex select-none items-center space-x-3">
                        <p>{{ capitalize(part.name) }}</p>
                        <LoaderCircleIcon class="h-4 w-4 animate-spin" v-if="!('result' in part)" />
                        <ChevronUpIcon
                          v-else-if="part.result"
                          :data-folded="!unfoldedTools.includes(part.id)"
                          class="h-4 w-4 transition-all duration-100 ease-in-out data-[folded=true]:rotate-180"
                        />
                        <CheckIcon v-else class="h-4 w-4 text-green-500" />
                      </div>
                    </button>
                    <div
                      v-if="unfoldedTools.includes(part.id) && 'result' in part"
                      class="mt-1 break-words border-l-2 border-white/30 pl-2 text-sm"
                    >
                      <p class="mb-1">{{ JSON.stringify(part.args) }}</p>
                      <ToolResult v-if="part.result" :tool="part" />
                      <div v-else>Tool didn't return any data</div>
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
                  class="flex space-x-1.5 rounded-md p-0.5 pl-0 backdrop-blur-sm"
                >
                  <button
                    v-if="finished(message)"
                    v-tooltip="'Copy'"
                    @click="copyToClipboard(getContent(message))"
                    class="rounded-md p-1 transition hover:bg-white/5"
                  >
                    <CopyIcon class="h-5 w-5" />
                  </button>
                  <button
                    v-if="lastMessage === message"
                    v-tooltip="'Regenerate'"
                    @click="regenerateLastMessage"
                    class="rounded-md p-1 transition hover:bg-white/5"
                  >
                    <RefreshCwIcon class="h-5 w-5 transition-all duration-500" />
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex flex-1 items-center justify-center">
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
    <div class="pointer-events-none absolute bottom-0 left-0 right-0 z-10 sm:left-4 sm:right-4">
      <div
        class="pointer-events-auto mx-auto max-w-3xl rounded-3xl rounded-b-none border border-b-0 border-[#55CDFC]/20 bg-[#55CDFC]/25 p-2 pb-0 shadow-lg backdrop-blur-sm dark:border-[#f7a8b8]/5 dark:bg-[#f7a8b8]/5 dark:backdrop-blur-md"
      >
        <div
          class="flex flex-col items-start rounded-2xl rounded-b-none border border-b-0 border-[#55CDFC]/10 bg-[#55CDFC]/15 p-1 dark:border-[#f7a8b8]/5 dark:bg-[#f7a8b8] dark:bg-opacity-[4%]"
        >
          <div class="flex w-full flex-row items-start space-x-1.5 p-1.5 pb-0">
            <textarea
              v-model="input"
              @keydown="handleKeyDown"
              placeholder="Type a message..."
              class="light:placeholder:text-black/70 max-h-[10rem] min-h-[3rem] w-full resize-none overflow-y-auto bg-transparent focus:outline-none"
            />
            <!-- buttons -->
            <label
              :aria-disabled="!includes(models[model].capabilities, 'imageInput')"
              class="rounded-xl p-2 transition hover:bg-black/10 aria-[disabled=false]:cursor-pointer aria-[disabled=true]:text-[#333333]/40 dark:hover:bg-white/5 dark:aria-[disabled=true]:text-white/40"
              :title="
                includes(models[model].capabilities, 'imageInput')
                  ? 'Upload File'
                  : 'This model does not support file input'
              "
              for="file"
            >
              <PaperclipIcon class="h-5 w-5" />
            </label>
            <button
              @click="handleSend"
              :data-action="abortController ? 'abort' : 'send'"
              class="group rounded-xl bg-gradient-to-br from-[#5BCEFA] to-[#F5A9B8] p-2 transition-colors duration-300 ease-in-out hover:from-[#4AB0D1] hover:to-[#E994A3] hover:shadow-lg"
            >
              <SendIcon class="h-5 w-5 group-data-[action=abort]:hidden" />
              <CircleStopIcon class="h-5 w-5 group-data-[action=send]:hidden" />
            </button>
          </div>
          <div class="flex gap-1">
            <ModelSelector v-model="model" />
            <EffortSelector
              v-model="reasoningEffort"
              v-if="includes(models[model].capabilities, 'effortControl')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import 'floating-vue/dist/style.css';
import 'highlight.js/styles/github-dark.min.css';

import EffortSelector from '@/components/effort-selector.vue';
import ErrorPopup from '@/components/error-popup.vue';
import Loader from '@/components/loader.vue';
import ModelSelector from '@/components/model-selector.vue';
import ToolResult from '@/components/tool-result.vue';
import { parseMarkdown } from '@/lib/markdown.ts';
import { trpc } from '@/lib/trpc';
import type { Nullish } from '@/lib/types.ts';
import { capitalize, safeParse } from '@/lib/utils.ts';
import router from '@/router';
import { useConversationStore } from '@/stores/conversations.ts';
import { useModelStore } from '@/stores/models.ts';
import { type } from 'arktype';
import {
  AssistantMessage,
  Conversation,
  Effort,
  Message,
  MessageChunk,
  models,
  SSE,
  type Model
} from 'common';
import { includes } from 'common/utils';
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
  type LucideProps
} from 'lucide-vue-next';
import SuperJSON from 'superjson';
import { computed, nextTick, onMounted, ref, watch, type FunctionalComponent } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';

const route = useRoute();
const conversationStore = useConversationStore();
const modelStore = useModelStore();

const messages = ref<{ loading: boolean; error: string | null; array: (typeof Message.infer)[] }>({
  loading: true,
  error: null,
  array: []
});
const fetchToken = ref(0);
const conversation = ref<typeof Conversation.infer | null>(
  conversationStore.conversations.find(c => c.id === route.params.id) ?? null
);
const input = ref('');
const error = ref<Omit<Extract<typeof SSE.infer, { kind: 'error' }>, 'kind' | 'for'> | null>(null);
const showError = ref(false);
const abortController = ref<AbortController | null>(null);
const unfoldedTools = ref<FullToolCall['id'][]>([]);
const lastMessage = computed(() => messages.value.array?.at(-1) ?? null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toolIcons: Record<string, FunctionalComponent<LucideProps, any, any, any>> = {
  weather: SunIcon,
  scrape: GlobeIcon,
  search: SearchIcon,
  repo_tree: FolderTreeIcon,
  repo_file: FileDiffIcon,
  default: HammerIcon
};

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

const model = ref<typeof Model.infer>(modelStore.models[0] ?? 'o3-mini');
const reasoningEffort = ref<typeof Effort.infer>('high');

watch(model, function (newValue, oldValue) {
  if (newValue !== oldValue && conversation.value && conversation.value.model !== newValue) {
    conversationStore.$modify({ id: conversation.value.id, model: newValue });
  }
});

watch(reasoningEffort, function (newValue, oldValue) {
  if (
    newValue !== oldValue &&
    conversation.value &&
    conversation.value.reasoningEffort !== newValue
  ) {
    conversationStore.$modify({ id: conversation.value.id, reasoningEffort: newValue });
  }
});

function init(id: string) {
  console.log('[INIT]', id);

  fetchToken.value++;
  const token = fetchToken.value;
  const isNew = id === 'new';

  messages.value = { loading: false, error: null, array: [] };
  const c = conversationStore.conversations.find(c => c.id === id) ?? null;
  conversation.value = c;
  model.value = c?.model ?? modelStore.models[0] ?? 'o3-mini';
  reasoningEffort.value = c?.reasoningEffort ?? 'high';
  error.value = null;
  showError.value = false;

  if (isNew) {
    return;
  }

  fetchMessages(id, token);
}

function fetchMessages(id: string, token: number) {
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

  trpc.conversation.getMessages
    .query({ id })
    .then(msgs => {
      if (token !== fetchToken.value) return;
      messages.value.loading = false;

      if (messages.value.array.length > msgs.length) {
        const lastIndex = msgs.length - 1;
        const local = messages.value.array[lastIndex]!;
        const remote = msgs[lastIndex]!;
        // if both messages are the same and the last message is not finished, don't update
        if (equals(local, remote) && !finished(messages.value.array.at(-1))) return;
      }

      messages.value.array = msgs;
      localStorage.setItem(id, SuperJSON.stringify(msgs));
    })
    .catch(e => {
      if (token !== fetchToken.value) return;
      messages.value.loading = false;
      messages.value.error = e.message;
    });

  const out = Message.array()(safeParse(localStorage.getItem(id)));
  if (token !== fetchToken.value) return;
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
    init(to.params.id as string);
  }
  return next();
});

onMounted(() => {
  init(route.params.id as string);
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

async function handleSend() {
  if (abortController.value) {
    abortController.value.abort();
    (messages.value.array.at(-1) as typeof AssistantMessage.infer).chunks.push(null);
    abortController.value = null;
    return;
  }

  if (messages.value.array.at(-1)?.role === 'user') {
    return;
  }

  const content = input.value.trim();
  if (content) {
    let id: string = route.params.id as string;

    if (route.params.id === 'new') {
      const c = await conversationStore.$create({ model: model.value });
      id = c.id;
      skipNextInit = true;
      await router.push({ name: 'c', params: { id } });
    }

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
  message
}: CompletionOptions) {
  abortController.value = new AbortController();

  let msg = messages.value.array.at(-1)!;
  if (msg.role === 'user' || finished(msg)) {
    const index =
      messages.value.array.push({
        role: 'assistant',
        chunks: [],
        author: model.value
      }) - 1;
    msg = messages.value.array[index] as typeof AssistantMessage.infer;
  }

  const stream = await trpc.completion.query({ message: message!, for: conversationId });

  for await (const chunk of stream) {
    msg.chunks.push(chunk);
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
    handleSend();
  }
  autoResize(e.target as HTMLTextAreaElement);
}

function autoResize(textarea: HTMLTextAreaElement) {
  textarea.style.height = '3rem'; // Reset height to min (2 rows)
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
  @apply break-words text-[#333333] dark:text-gray-200

  a
    @apply text-sky-600 hover:underline dark:text-pink-400

  pre:has(code.hljs)
    @apply backdrop-blur-sm text-sm overflow-x-auto max-w-full rounded-md border-t-0 rounded-t-none border border-black/10 dark:border-white/10
    code
      @apply block p-2 whitespace-pre-wrap break-all font-sf_mono

  // Code blocks without language ```
  pre:not(:has(code.hljs))
    @apply rounded overflow-x-auto bg-sky-50 dark:bg-zinc-800 p-2 my-2 border border-black/10 dark:border-white/10
    code
      @apply font-sf_mono text-sm

  // Inline code `code`
  code:not(.hljs)
    @apply bg-sky-100 dark:bg-pink-950/50 backdrop-blur-sm rounded px-1 py-0.5 text-sm font-sf_mono text-sky-800 dark:text-pink-300 border border-sky-200 dark:border-pink-800/50

  strong
    @apply font-bold

  em
    @apply italic

  // Headings
  h1, h2, h3, h4, h5, h6
    @apply font-bold mt-4 mb-2 pb-1

  h1
    @apply text-3xl
  h2
    @apply text-2xl
  h3
    @apply text-xl
  h4
    @apply text-lg
  h5
    @apply text-base
  h6
    @apply text-sm

  // Lists
  ol
    @apply list-decimal list-outside ml-6 my-2
    & ol, & ul
      @apply mt-1 mb-1

  ul
    @apply list-disc list-outside ml-6 my-2
    & ul, & ol
      @apply mt-1 mb-1

  li
    @apply mb-1
    & > ul, & > ol
      @apply ml-4

  hr
    @apply border-t border-sky-200 dark:border-pink-800/50 my-4

  // Blockquote
  blockquote
    @apply border-l-4 border-sky-300 dark:border-pink-600/80 p-2 pl-3 italic bg-sky-50 dark:bg-pink-950/30 rounded my-3 text-gray-700 dark:text-gray-300
    p // Remove default margins inside blockquote
      @apply m-0

    // Callouts like [!NOTE]
    &[data-type="note"],
    &[data-type="tip"],
    &[data-type="important"],
    &[data-type="warning"],
    &[data-type="caution"],
    &[data-type="error"]
      @apply not-italic
      .callout-title
        @apply font-bold flex items-center gap-1.5 mb-1 // Style title

    &[data-type="note"],
    &[data-type="tip"]
      @apply border-sky-500 dark:border-pink-500
      .callout-title
        @apply text-sky-600 dark:text-pink-400

    &[data-type="important"]
      @apply border-violet-500 dark:border-violet-400
      .callout-title
        @apply text-violet-600 dark:text-violet-400

    &[data-type="warning"]
      @apply border-yellow-500 dark:border-yellow-400
      .callout-title
        @apply text-yellow-600 dark:text-yellow-400

    &[data-type="caution"],
    &[data-type="error"]
      @apply border-red-500 dark:border-red-400
      .callout-title
        @apply text-red-600 dark:text-red-400

  // Table
  table
    @apply w-full border-collapse my-4 text-sm border border-sky-200 dark:border-white/20
    th, td
      @apply border border-sky-200 dark:border-white/20 p-2 text-left

    th
      @apply bg-sky-100 dark:bg-white/10 font-semibold

    tr:nth-child(even)
      @apply bg-sky-50/50 dark:bg-white/5

// Highlight.js theme overrides
.hljs
  @apply bg-transparent dark:bg-transparent // Use parent pre background

.hljs-container
  @apply flex flex-col
  &:not(:last-child)
    @apply mb-1
  &:not(:first-child)
    @apply mt-1

.hljs-header // Style for code block header (e.g., language name)
  @apply bg-sky-100 dark:bg-zinc-700 flex items-center justify-between py-1 px-3 text-xs text-gray-600 dark:text-gray-400 rounded-t-md border-b border-black/10 dark:border-white/10

// Tooltip styles
.v-popper--theme-tooltip
  .v-popper__inner
    @apply bg-white/15 backdrop-blur-md dark:bg-vue-black-tooltip dark:border-[1px] dark:border-[#847A6C] text-xs rounded-md shadow-lg

  .v-popper__arrow-outer
    @apply hidden

// Disable transitions for light mode tooltips (fix for flickering)
@media (prefers-color-scheme: light)
  .v-popper__popper
    transition: none !important

    *
      transition: none !important
</style>
