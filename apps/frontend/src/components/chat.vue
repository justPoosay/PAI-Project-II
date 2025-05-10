<template>
  <!-- Chat Area -->
  <div class="relative flex flex-1 flex-col">
    <!-- Chat Messages -->
    <div v-if="messages.length" class="flex-1 overflow-x-hidden overflow-y-auto p-4 pb-28">
      <div class="mx-auto max-w-5xl space-y-2">
        <div
          v-for="(messageMetadata, messageIndex) in messages.map(getMessageMetadata)"
          :key="messageIndex"
          class="relative"
        >
          <div
            :data-self="messageMetadata.author === 'user'"
            class="group flex items-start justify-start data-[self=true]:justify-end"
          >
            <div
              :data-self="messageMetadata.author === 'user'"
              class="group flex max-w-full flex-col data-[self=true]:items-end md:max-w-[90%]"
            >
              <div v-if="messageMetadata.reasoning" class="pb-4">
                <button
                  :data-reasoning="!messageMetadata.message.length && !messageMetadata.finished"
                  class="text-muted flex cursor-pointer items-center gap-2 text-sm data-[reasoning=true]:animate-pulse"
                  @click="
                    unfoldedReasoning = unfoldedReasoning === messageIndex ? null : messageIndex
                  "
                >
                  <ChevronRightIcon
                    :data-unfolded="unfoldedReasoning === messageIndex"
                    class="size-4 transition-all duration-100 ease-in-out data-[unfolded=true]:rotate-90"
                  />
                  Reasoning
                </button>
                <div
                  v-if="unfoldedReasoning === messageIndex"
                  v-html="parseMarkdown(messageMetadata.reasoning)"
                  class="markdown-content mt-1 rounded-md bg-black/5 p-2 dark:bg-black/50"
                />
              </div>
              <div
                class="border-accent/40 group-data-[self=true]:bg-accent/50 relative w-fit rounded-lg px-2 group-data-[self=true]:border group-data-[self=true]:px-4 group-data-[self=true]:py-2 group-data-[self=true]:shadow-xs dark:border-[#422f42] dark:group-data-[self=true]:bg-[#3E2A3E]"
              >
                <template v-if="editingIndex !== messageIndex">
                  <template v-for="(part, partIndex) in messageMetadata.message">
                    <div
                      v-if="typeof part === 'string'"
                      v-html="parseMarkdown(part, false)"
                      class="markdown-content"
                      :key="`str@${partIndex}`"
                    />
                    <div v-else class="my-1.5 w-fit" :key="partIndex">
                      <div
                        class="border-border bg-sidebar dark:bg-background overflow-hidden rounded-lg border shadow-sm transition-all hover:shadow-md"
                      >
                        <div
                          class="flex cursor-pointer items-center space-x-2 p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                          @click="
                            unfoldedTools.includes(part.id)
                              ? (unfoldedTools = unfoldedTools.filter(v => v !== part.id))
                              : unfoldedTools.push(part.id)
                          "
                        >
                          <component
                            :is="toolIcons[part.name] ?? toolIcons['default']"
                            class="text-muted size-4 flex-shrink-0"
                          />
                          <p class="text-primary text-xs font-medium">
                            {{ capitalize(part.name) }}
                          </p>
                          <span
                            :data-finished="!!('result' in part)"
                            class="group relative flex size-4 flex-shrink-0 items-center [&_svg]:absolute [&_svg]:size-full [&_svg]:scale-0 [&_svg]:-rotate-90 [&_svg]:transition-all [&_svg]:duration-200"
                          >
                            <LoaderCircleIcon
                              class="text-blue animate-spin group-data-[finished=false]:scale-100 group-data-[finished=false]:rotate-0"
                            />
                            <CheckIcon
                              class="text-emerald-500 group-data-[finished=true]:scale-100 group-data-[finished=true]:rotate-0"
                            />
                          </span>
                          <ChevronRightIcon
                            :data-unfolded="unfoldedTools.includes(part.id)"
                            class="text-muted ml-1 size-4 flex-shrink-0 transition-transform duration-200 data-[unfolded=true]:rotate-90"
                          />
                        </div>
                        <div
                          v-if="unfoldedTools.includes(part.id)"
                          class="border-border border-t bg-black/5 p-2.5 text-xs dark:bg-white/5"
                        >
                          <div>
                            <p class="text-muted mb-0.5 font-medium">Arguments:</p>
                            <pre
                              class="text-primary mt-1 rounded-md bg-black/10 p-2 font-mono text-xs leading-relaxed whitespace-pre-wrap dark:bg-black/30"
                              v-html="highlight(formatJson(part.args), 'json')"
                            />
                          </div>
                          <div v-if="'result' in part" class="mt-2">
                            <p class="text-muted mb-0.5 font-medium">Result:</p>
                            <pre
                              class="text-primary mt-1 rounded-md bg-black/10 p-2 font-mono text-xs leading-relaxed whitespace-pre-wrap dark:bg-black/30"
                              v-html="highlight(formatJson(part.result), 'json')"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                  <p
                    v-if="
                      !messageMetadata.message.length &&
                      !messageMetadata.reasoning &&
                      !messageMetadata.finished
                    "
                    class="text-muted animate-pulse text-sm"
                  >
                    Waiting for response...
                  </p>
                </template>
                <textarea
                  v-else
                  ref="editInput"
                  v-model="editingContent"
                  @keydown="e => handleKeyDown(e, () => confirmEdit(messageIndex))"
                  @keydown.esc.prevent="cancelEdit"
                  @input="handleInput"
                  class="placeholder:text-muted-light dark:placeholder:text-muted-dark -mx-4 -my-2 max-h-48 min-h-[3rem] overflow-y-auto bg-transparent p-2 focus:outline-none"
                />
                <div
                  v-if="messageMetadata.error && editingIndex !== messageIndex"
                  class="mt-1 flex items-center space-x-1 rounded-md bg-red-100 p-2 text-red-700 dark:bg-red-900/50"
                >
                  <AlertTriangleIcon class="size-4" />
                  <span class="text-sm">{{ messageMetadata.error }}</span>
                </div>
              </div>
              <div
                v-if="editingIndex !== messageIndex"
                class="flex items-center gap-1 pt-1 opacity-0 transition group-hover:opacity-100 group-data-[self=true]:justify-end"
              >
                <button
                  v-tooltip="{ content: 'Retry message', position: 'bottom' }"
                  @click="regenerateMessage(messageIndex)"
                  class="hover:bg-accent/10 cursor-pointer rounded-md p-2 transition dark:hover:bg-white/5"
                >
                  <RefreshCwIcon class="size-4" />
                </button>
                <button
                  v-tooltip="{ content: 'Edit message', position: 'bottom' }"
                  class="hover:bg-accent/10 cursor-pointer rounded-md p-2 transition dark:hover:bg-white/5"
                  v-if="messageMetadata.author === 'user' && editingIndex !== messageIndex"
                  @click="startEditing(messageIndex)"
                >
                  <SquarePenIcon class="size-4" />
                </button>
                <button
                  v-tooltip="{ content: 'Copy message', position: 'bottom' }"
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
              ref="chatInput"
              v-model="input"
              @keydown="e => handleKeyDown(e, handleSend)"
              @input="handleInput"
              placeholder="Type a message..."
              class="placeholder:text-muted-light dark:placeholder:text-muted-dark max-h-[10rem] min-h-[3rem] w-full resize-none overflow-y-auto bg-transparent focus:outline-none"
            />
            <!-- buttons -->
            <label
              :aria-disabled="!includes(models[model].capabilities, 'imageInput')"
              class="aria-disabled:text-muted rounded-xl p-2 transition hover:bg-black/10 aria-disabled:hover:bg-transparent aria-[disabled=false]:cursor-pointer dark:hover:bg-white/5 dark:aria-disabled:text-white/40"
              v-tooltip="
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
import { fromLS } from '@/lib/local';
import { highlight, parseMarkdown } from '@/lib/markdown.ts';
import { trpc } from '@/lib/trpc';
import { capitalize, selfOrFirst } from '@/lib/utils.ts';
import router from '@/router';
import { useChatStore } from '@/stores/chats';
import { models, type Effort, type Message, type Model } from 'common';
import { includes, type EnhancedOmit } from 'common/utils';
import {
  AlertTriangleIcon,
  CheckIcon,
  ChevronRightIcon,
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
  SquarePenIcon,
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
const unfoldedReasoning = ref<number | null>(null);
const editingIndex = ref<number | null>(null);
const editingContent = ref<string>('');
const chatInput = ref<HTMLTextAreaElement | null>(null);
const editInput = ref<HTMLTextAreaElement | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toolIcons: Record<string, FunctionalComponent<LucideProps, any, any, any>> = {
  weather: SunIcon,
  scrape: GlobeIcon,
  search: SearchIcon,
  repo_tree: FolderTreeIcon,
  repo_file: FileDiffIcon,
  default: HammerIcon
};

function formatJson(data: unknown) {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data); // Fallback for non-serializable data
  }
}

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

  trpc.chat.get.query({ id }).then(chat => {
    if (token !== fetchToken.value || !chat) return;
    messages.value = chat.messages;
    if (chat.model) {
      model.value = chat.model;
    }
    if (chat.reasoningEffort) {
      reasoningEffort.value = chat.reasoningEffort;
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

  console.log(messageMetadata, msg.chunks);

  return messageMetadata;
}

async function handleSend() {
  const last = messages.value.at(-1);

  if (abortController.value) {
    abortController.value.abort();
    if (last?.role === 'assistant') {
      last.chunks.push({ type: 'error', message: 'Aborted by user' });
    }
    abortController.value = null;
    return;
  }

  if (last?.role === 'user') {
    return;
  }

  const content = input.value.trim();
  if (!content) return;

  let id: string = route.params['id'] as string;

  if (route.params['id'] === 'new') {
    const c = await chatStore.$create({ model: model.value });
    id = c._id.toHexString();
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
    message: content
  });
}

async function requestCompletion(
  input: EnhancedOmit<
    Parameters<typeof trpc.completion.query>[0],
    'model' | 'reasoningEffort' | 'preferences' | 'system'
  >
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

  const stream = await trpc.completion.query(
    {
      ...input,
      model: model.value,
      reasoningEffort: reasoningEffort.value,
      preferences: fromLS('user-preferences'),
      system: fromLS('system-prompt')
    },
    { signal: abortController.value?.signal }
  );

  for await (const chunk of stream) {
    msg.chunks.push(chunk);
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

function handleKeyDown(e: KeyboardEvent, onEnter: () => void = handleSend) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    onEnter();
  }
  autoResize(e.target as HTMLTextAreaElement);
}

function autoResize(textarea: HTMLTextAreaElement) {
  textarea.style.height = 'auto';
  const scrollHeight = textarea.scrollHeight;
  textarea.style.height = scrollHeight + 'px';
}

watch(input, () => {
  nextTick(() => {
    if (chatInput.value) {
      autoResize(chatInput.value);
    }
  });
});

watch(editingContent, () => {
  nextTick(() => {
    if (editInput.value) {
      autoResize(editInput.value);
    }
  });
});

function startEditing(index: number) {
  editingIndex.value = index;
  const msg = messages.value[index];
  if (msg && msg.role === 'user') {
    editingContent.value = msg.content;
  }
}

function cancelEdit() {
  editingIndex.value = null;
  editingContent.value = '';
}

async function confirmEdit(index: number) {
  messages.value = messages.value.slice(0, index);
  messages.value.push({ role: 'user', content: editingContent.value });
  editingIndex.value = null;
  const chatId = route.params['id'] as string;
  await requestCompletion({ id: chatId, messageIndex: index, message: editingContent.value });
  editingContent.value = '';
}

function handleInput(e: Event) {
  const target = e.target;
  if (target instanceof HTMLTextAreaElement) {
    autoResize(target);
  }
}
</script>
