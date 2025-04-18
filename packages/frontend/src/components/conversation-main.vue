<template>
  <!-- Chat Area -->
  <div class="relative flex flex-1 flex-col">
    <!-- Chat Messages -->
    <div
      v-if="!messages.loading && !messages.error && messages.array.length"
      class="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-32 dark:pb-28"
    >
      <div class="mx-auto max-w-5xl">
        <div v-for="(message, i) in messages.array" :key="i" class="relative mb-2">
          <div
            :data-self="message.role === 'user'"
            class="flex items-end justify-start space-x-2 data-[self=true]:justify-end dark:items-start"
          >
            <component
              v-if="message.role === 'assistant'"
              class="h-6 w-6 max-md:hidden dark:mt-2"
              :alt="message.author"
              :is="icons[models[message.author].icon]"
              v-tooltip="{ content: modelFullName(message.author), placement: 'left' }"
            />
            <div
              :data-self="message.role === 'user'"
              class="light:bg-[#D8E6F0] relative max-w-[80%] rounded-tl-2xl rounded-tr-2xl p-2 shadow-lg data-[self=false]:rounded-br-2xl data-[self=true]:rounded-bl-2xl data-[self=true]:bg-[#B3D6E6] data-[self=false]:pb-3 max-md:max-w-full dark:max-w-[90%] dark:rounded-lg dark:shadow-none dark:data-[self=false]:rounded-br-lg dark:data-[self=true]:rounded-bl-lg dark:data-[self=true]:bg-[#3E2A3E]"
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
                  class="light:bg-white/15 light:absolute light:-bottom-3 light:left-1 light:shadow-md flex rounded-md p-0.5 backdrop-blur-sm dark:space-x-1.5 dark:pl-0"
                >
                  <button
                    v-if="finished(message)"
                    v-tooltip="'Copy'"
                    @click="copyToClipboard(getContent(message))"
                    class="rounded-md p-1 transition hover:bg-white/5"
                  >
                    <CopyIcon class="h-3 w-3 dark:h-5 dark:w-5" />
                  </button>
                  <button
                    v-if="lastMessage === message"
                    v-tooltip="'Regenerate'"
                    @click="regenerateLastMessage"
                    class="group rounded-md p-1 transition hover:bg-white/5"
                  >
                    <RefreshCwIcon
                      class="h-3 w-3 transition-all duration-500 group-hover:rotate-[360deg] dark:h-5 dark:w-5"
                    />
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
import { icons } from '@/lib/icons';
import { parseMarkdown } from '@/lib/markdown.ts';
import { trpc } from '@/lib/trpc';
import type { Nullish } from '@/lib/types.ts';
import { capitalize, modelFullName, safeParse } from '@/lib/utils.ts';
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
    console.log('init(' + to.params.id + ')');
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
  @apply bg-white/5 dark:bg-[#101010]

.hljs-container
  @apply flex flex-col light:shadow-md
  &:not(:last-child)
    @apply mb-1
  &:not(:first-child)
    @apply mt-1

.hljs-header
  @apply bg-white/10 dark:bg-[#181818] flex items-center justify-between py-2 px-3 text-sm mt-1

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
