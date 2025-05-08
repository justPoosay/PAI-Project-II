<template>
  <!-- Chat Area -->
  <div class="relative flex flex-1 flex-col">
    <!-- Chat Messages -->
    <div v-if="messages.length" class="flex-1 overflow-x-hidden overflow-y-auto p-4 pb-28">
      <div class="mx-auto max-w-5xl space-y-8">
        <div
          v-for="(messageMetadata, messageIndex) in messages.map(getMessageMetadata)"
          :key="messageIndex"
          class="relative"
        >
          <div
            :data-self="messageMetadata.author === 'user'"
            class="group flex items-start justify-start space-x-2 data-[self=true]:justify-end"
          >
            <div
              :data-self="messageMetadata.author === 'user'"
              class="group max-w-full md:max-w-[90%]"
            >
              <div
                class="relative rounded-lg border-[#a2d0e5] p-2 group-data-[self=false]:pb-0 group-data-[self=true]:border group-data-[self=true]:bg-[#B3D6E6] group-data-[self=true]:px-4 group-data-[self=true]:shadow-xs dark:border-[#422f42] dark:group-data-[self=true]:bg-[#3E2A3E]"
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
                      <component
                        :is="toolIcons[part.name] ?? toolIcons['default']"
                        class="size-4"
                      />
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
              </div>
              <div
                class="flex items-center gap-1 rounded-md px-2 pt-1 pl-0 opacity-0 transition group-hover:opacity-100 group-data-[self=true]:justify-end"
              >
                <button
                  title="Retry message"
                  @click="regenerateMessage(messageIndex)"
                  class="hover:bg-accent/10 cursor-pointer rounded-md p-2 transition dark:hover:bg-white/5"
                >
                  <RefreshCwIcon class="size-4" />
                </button>
                <button
                  v-if="messageMetadata.finished"
                  title="Copy message"
                  @click="
                    copyToClipboard(
                      messageMetadata.message.filter(v => typeof v === 'string').join('')
                    )
                  "
                  class="hover:bg-accent/10 cursor-pointer rounded-md p-2 transition dark:hover:bg-white/5"
                >
                  <CopyIcon class="size-4" />
                </button>
                <p
                  v-if="messageMetadata.author !== 'user'"
                  class="text-muted ml-2 text-sm select-none"
                >
                  Generated with {{ models[messageMetadata.author].name }}
                </p>
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
import { query } from '@/lib/api';
import { fromLS } from '@/lib/local';
import { parseMarkdown } from '@/lib/markdown.ts';
import { capitalize, selfOrFirst } from '@/lib/utils.ts';
import router from '@/router';
import { useChatStore } from '@/stores/chats';
import {
  MessageChunk,
  models,
  type AssistantMessage,
  type Effort,
  type Message,
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
import { computed, nextTick, onMounted, ref, watch, type FunctionalComponent } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';

const route = useRoute();
const chatStore = useChatStore();

const id = computed(() => selfOrFirst(route.params['id'])!);

const messages = ref<Message[]>([]);
const fetchToken = ref(0);
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

watch(reasoningEffort, function (reasoningEffort) {
  chatStore.$modify({ id: id.value, reasoningEffort });
});

function init(id: string) {
  console.log('[INIT]', id);

  fetchToken.value++;
  const token = fetchToken.value;
  const isNew = id === 'new';

  messages.value = [];

  if (isNew) {
    model.value = fromLS('default-model');
    reasoningEffort.value = fromLS('default-reasoning-effort');

    return;
  }

  query('GET /chat/:id', { id }).then(result => {
    if (result.isOk()) {
      if (token !== fetchToken.value || !result.value) return;
      messages.value = result.value.messages;
      if (result.value.model) {
        model.value = result.value.model;
      }
      if (result.value.reasoningEffort) {
        reasoningEffort.value = result.value.reasoningEffort;
      }
    } else {
      if (result.error === 404) {
        router.push({ name: 'chat', params: { id: 'new' } });
        return;
      }
      console.error('Failed to fetch chat', result.error);
    }
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
    init(selfOrFirst(to.params['id'])!);
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
    const result = await chatStore.$create();
    if (result.isOk()) {
      id = result.value._id.toHexString();
      skipNextInit = true;
      await router.push({ name: 'chat', params: { id } });
    } else {
      console.error('Failed to create chat', result.error);
    }
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
    message: content
  });
}

/*
type.or({ message: 'string>0' }, { messageIndex: 'number' }).and({
    'preferences?': {
      name: 'string',
      occupation: 'string',
      selectedTraits: 'string',
      additionalInfo: 'string'
    },
    model: Model,
    reasoningEffort: Effort
  })
*/

async function requestCompletion(
  input: ({ message: string } | { messageIndex: number }) & { id: string }
) {
  abortController.value = new AbortController();

  let msg = messages.value.at(-1);
  if (!msg || msg?.role === 'user') {
    const index =
      messages.value.push({
        role: 'assistant',
        chunks: [],
        author: model.value
      }) - 1;
    msg = messages.value[index];
  }

  // should never happen
  if (msg?.role !== 'assistant') {
    return;
  }

  // const stream = await trpc.completion.query(
  //   {
  //     ...input,
  //     model: model.value,
  //     reasoningEffort: reasoningEffort.value,
  //     preferences: fromLS('user-preferences')
  //   },
  //   { signal: abortController.value?.signal }
  // );

  // for await (const chunk of stream) {
  //   msg.chunks.push(chunk);
  // }

  // abortController.value = null;

  const res = await fetch(`/api/completion/${input.id}`, {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      model: model.value,
      reasoningEffort: reasoningEffort.value,
      preferences: fromLS('user-preferences')
    }),
    signal: abortController.value?.signal,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    console.error('Failed to request completion', res.status);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    console.error('Failed to get reader');
    return;
  }

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      const text = decoder.decode(value, { stream: true });
      const chunks = text
        .split(/(?<=\})\s+(?=\{)/)
        .map(v => v.trim())
        .filter(v => v)
        .map(v => JSON.parse(v))
        .filter(MessageChunk.allows);
      msg.chunks.push(...chunks);
    }
  }

  abortController.value = null;
}

async function regenerateMessage(messageIndex: number) {
  const message = messages.value.at(messageIndex);
  if (!message) return;
  if (message.role === 'user') {
    messages.value = messages.value.slice(0, messageIndex + 1);
  } else {
    messages.value = messages.value.slice(0, messageIndex);
  }

  await requestCompletion({
    id: route.params['id'] as string,
    messageIndex
  });
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
