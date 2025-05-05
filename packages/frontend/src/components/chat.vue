<template>
  <!-- Chat Area -->
  <div class="relative flex flex-1 flex-col">
    <!-- Chat Messages -->
    <div v-if="messages.length" class="flex-1 overflow-x-hidden overflow-y-auto p-4 pb-28">
      <div class="mx-auto max-w-5xl space-y-8">
        <div
          v-for="(messageMetadata, i) in messages.map(getMessageMetadata)"
          :key="i"
          class="relative"
        >
          <div
            :data-self="messageMetadata.author === 'user'"
            class="flex items-start justify-start space-x-2 data-[self=true]:justify-end"
          >
            <div
              :data-self="messageMetadata.author === 'user'"
              class="group relative max-w-[90%] rounded-lg border-[#a2d0e5] p-2 data-[self=true]:border data-[self=true]:bg-[#B3D6E6] data-[self=true]:px-4 data-[self=true]:shadow-xs max-md:max-w-full dark:border-[#422f42] dark:data-[self=true]:bg-[#3E2A3E]"
            >
              <template v-for="(part, partIndex) in messageMetadata.message">
                <div
                  v-if="typeof part === 'string'"
                  v-html="parseMarkdown(part, false)"
                  class="markdown-content"
                  v-bind:key="`str@${partIndex}`"
                />
                <div v-else class="m-1 ml-0" v-bind:key="partIndex">
                  <button
                    class="inline-flex cursor-pointer items-center space-x-1 rounded-lg bg-white/15 p-1 text-sm dark:bg-[#282828]"
                    @click="
                      unfoldedTools.includes(part.id)
                        ? (unfoldedTools = unfoldedTools.filter(v => v !== part.id))
                        : unfoldedTools.push(part.id)
                    "
                  >
                    <component :is="toolIcons[part.name] ?? toolIcons['default']" class="size-4" />
                    <div class="inline-flex items-center space-x-3 select-none">
                      <p>{{ capitalize(part.name) }}</p>
                      <LoaderCircleIcon class="size-4 animate-spin" v-if="!('result' in part)" />
                      <ChevronUpIcon
                        v-else-if="part.result"
                        :data-folded="!unfoldedTools.includes(part.id)"
                        class="size-4 transition-all duration-100 ease-in-out data-[folded=true]:rotate-180"
                      />
                      <CheckIcon v-else class="size-4 text-green-500" />
                    </div>
                  </button>
                </div>
              </template>
              <div
                v-if="messageMetadata.author !== 'user'"
                class="flex space-x-1.5 rounded-md p-0.5 pl-0 backdrop-blur-xs"
              >
                <button
                  v-if="messageMetadata.finished"
                  title="Copy"
                  @click="
                    copyToClipboard(
                      messageMetadata.message.filter(v => typeof v === 'string').join('')
                    )
                  "
                  class="rounded-md p-1 transition hover:bg-white/5"
                >
                  <CopyIcon class="size-5" />
                </button>
                <button
                  title="Regenerate"
                  @click="regenerateLastMessage"
                  class="rounded-md p-1 transition hover:bg-white/5"
                >
                  <RefreshCwIcon class="size-5 transition-all duration-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex flex-1 items-center justify-center">
      <div class="text-center">
        <h1 class="text-2xl font-bold">No messages yet</h1>
        <h2>Start typing to begin a conversation</h2>
      </div>
    </div>
    <!-- Input Area -->
    <div class="pointer-events-none absolute right-0 bottom-0 left-0 z-10 sm:right-4 sm:left-4">
      <div
        class="dark:from-blue/10 dark:via-purple/10 dark:to-pink/10 from-blue/30 via-purple/30 to-pink/30 pointer-events-auto mx-auto max-w-3xl rounded-3xl rounded-b-none border-b-0 bg-gradient-to-r p-2 pb-0 shadow-lg backdrop-blur-lg"
      >
        <div
          class="dark:from-blue/5 dark:via-purple/5 dark:to-pink/5 from-blue/30 via-purple/30 to-pink/30 flex flex-col items-start rounded-2xl rounded-b-none border-b-0 border-transparent bg-gradient-to-r p-1"
        >
          <div class="flex w-full flex-row items-start space-x-1.5 p-1.5 pb-0">
            <textarea
              v-model="input"
              @keydown="handleKeyDown"
              placeholder="Type a message..."
              class="placeholder:text-muted-light dark:placeholder:text-muted-dark max-h-[10rem] min-h-[3rem] w-full resize-none overflow-y-auto bg-transparent focus:outline-none"
            />
            <!-- buttons -->
            <label
              :aria-disabled="!includes(models[model].capabilities, 'imageInput')"
              class="aria-disabled:text-muted rounded-xl p-2 transition hover:bg-black/10 aria-disabled:hover:bg-transparent aria-[disabled=false]:cursor-pointer dark:hover:bg-white/5 dark:aria-disabled:text-white/40"
              :title="
                includes(models[model].capabilities, 'imageInput')
                  ? 'Upload File'
                  : 'This model does not support file input'
              "
              for="file"
            >
              <PaperclipIcon class="size-5" />
            </label>
            <button
              @click="handleSend"
              :data-action="abortController ? 'abort' : 'send'"
              class="group from-btn-pri-start to-btn-pri-end hover:from-btn-pri-hover-start hover:to-btn-pri-hover-end active:from-btn-pri-act-start active:to-btn-pri-act-end cursor-pointer rounded-xl bg-linear-to-br p-2 transition ease-in-out hover:shadow-lg"
            >
              <SendIcon class="size-5 group-data-[action=abort]:hidden" />
              <CircleStopIcon class="size-5 group-data-[action=send]:hidden" />
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
import EffortSelector from '@/components/effort-selector.vue';
import ModelSelector from '@/components/model-selector.vue';
import { fromLS, toLS } from '@/lib/local';
import { parseMarkdown } from '@/lib/markdown.ts';
import { trpc } from '@/lib/trpc';
import { capitalize } from '@/lib/utils.ts';
import router from '@/router';
import { useChatStore, type Chat } from '@/stores/chats';
import { models, type AssistantMessage, type Effort, type Message, type Model } from 'common';
import { includes, type Nullish } from 'common/utils';
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
import { storeToRefs } from 'pinia';
import { computed, nextTick, onMounted, ref, watch, type FunctionalComponent } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';

const route = useRoute();

const chatStore = useChatStore();
const { chats } = storeToRefs(chatStore);

const messages = ref<Message[]>([]);
const fetchToken = ref(0);
const chat = computed(
  () =>
    chats.value.find(
      (c): c is Extract<Chat, { deleted: false }> =>
        !c.deleted && String(c._id) === route.params['id']
    ) ?? null
);
const input = ref('');
const abortController = ref<AbortController | null>(null);
const unfoldedTools = ref<string[]>([]);

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

const model = ref<Model>(fromLS('default-model'));
const reasoningEffort = ref<Effort>(fromLS('default-reasoning-effort'));

watch(model, function (newValue, oldValue) {
  toLS('default-model', newValue);
  if (newValue !== oldValue && chat.value && chat.value.model !== newValue) {
    chatStore.$modify({ id: String(chat.value._id), model: newValue });
  }
});

watch(reasoningEffort, function (newValue, oldValue) {
  toLS('default-reasoning-effort', newValue);
  if (newValue !== oldValue && chat.value && chat.value.reasoningEffort !== newValue) {
    chatStore.$modify({ id: String(chat.value._id), reasoningEffort: newValue });
  }
});

function init(id: string) {
  console.log('[INIT]', id);

  fetchToken.value++;
  const token = fetchToken.value;
  const isNew = id === 'new';

  messages.value = [];
  model.value = chat.value?.model ?? fromLS('default-model');
  reasoningEffort.value = chat.value?.reasoningEffort ?? 'high';

  if (isNew) {
    return;
  }

  fetchMessages(id, token);
}

function fetchMessages(id: string, token: number) {
  console.log('[FETCH]', id);

  trpc.chat.messages.query({ id }).then(msgs => {
    if (token !== fetchToken.value) return;
    messages.value = msgs;
  });
}

let skipNextInit = false;

onBeforeRouteUpdate((to, from, next) => {
  console.log('Route update', to.params['id'], from.params['id']);
  if (to.params['id'] !== from.params['id']) {
    if (skipNextInit) {
      skipNextInit = false;
      return next();
    }
    init(to.params['id'] as string);
  }
  return next();
});

onMounted(() => {
  init(route.params['id'] as string);
});

interface MessageMetadata {
  author: 'user' | Model;
  reasoning: string | null;
  message: (
    | {
        id: string;
        name: string;
        args: Record<string, unknown>;
        result?: unknown;
      }
    | string
  )[];
  error: string | null;
  finished: boolean;
}

function getMessageMetadata(msg: Message): MessageMetadata {
  const messageMetadata: MessageMetadata = {
    reasoning: null,
    message: [],
    error: null,
    finished: false,
    author: msg.role === 'user' ? 'user' : msg.author
  };

  if (msg.role === 'user') {
    messageMetadata.message = [msg.content];
    messageMetadata.finished = true;
    return messageMetadata;
  }

  for (const chunk of msg.chunks) {
    if (!chunk) continue;
    const lastIndex = messageMetadata.message.length - 1;
    const last = messageMetadata.message.at(-1);

    switch (chunk.type) {
      case 'text-delta':
        if (typeof last === 'string') {
          messageMetadata.message[lastIndex] = last + chunk.textDelta;
        } else {
          messageMetadata.message.push(chunk.textDelta);
        }
        break;
      case 'tool-call':
        messageMetadata.message.push({
          id: chunk.toolCallId,
          name: chunk.toolName,
          args: chunk.args
        });
        break;
      case 'reasoning':
        messageMetadata.reasoning = (messageMetadata.reasoning ?? '') + chunk.textDelta;
        break;
      case 'tool-result':
        if (typeof last === 'object' && last.id === chunk.toolCallId) {
          messageMetadata.message[lastIndex] = {
            ...last,
            result: chunk.result
          };
        }
        break;
    }
  }

  const last = msg.chunks.at(-1);
  if (last?.type === 'error') {
    messageMetadata.error = last.message;
    messageMetadata.finished = true;
  } else if (last === null) {
    messageMetadata.finished = true;
  }

  return messageMetadata;
}

async function handleSend() {
  if (abortController.value) {
    abortController.value.abort();
    (messages.value.at(-1) as AssistantMessage).chunks.push(null);
    abortController.value = null;
    return;
  }

  if (messages.value.at(-1)?.role === 'user') {
    return;
  }

  const content = input.value.trim();
  if (!content) return;

  let id: string = route.params['id'] as string;

  if (route.params['id'] === 'new') {
    const c = await chatStore.$create({ model: model.value });
    id = String(c._id);
    skipNextInit = true;
    await router.push({ name: 'chat', params: { id } });
  }

  messages.value.push(
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

  input.value = '';

  await requestCompletion({
    id,
    message: content,
    model: model.value
  });
}

/** Checks if the message ends with a null chunk */
function finished(msg: Nullish<Message>) {
  const u = undefined;
  return (msg ? ('chunks' in msg ? msg.chunks : u) : u)?.at(-1) === null;
}

interface CompletionOptions {
  id?: string;
  message: string | null;
  model?: Model;
  attachmentIds?: string[];
}

async function requestCompletion({
  id = route.params['id'] as string,
  message
}: CompletionOptions) {
  abortController.value = new AbortController();

  let msg = messages.value.at(-1)!;
  if (msg.role === 'user' || finished(msg)) {
    const index =
      messages.value.push({
        role: 'assistant',
        chunks: [],
        author: model.value
      }) - 1;
    msg = messages.value[index] as AssistantMessage;
  }

  const stream = await trpc.completion.query({
    message: message!,
    for: id,
    preferences: fromLS('user-preferences')
  });

  for await (const chunk of stream) {
    if (chunk?.type === 'error') {
      // TODO: handle error
      continue;
    }
    msg.chunks.push(chunk);
  }

  abortController.value = null;
}

async function regenerateLastMessage() {
  const last = messages.value.at(-1);
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
