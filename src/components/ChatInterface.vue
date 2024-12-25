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
        <div class="flex flex-col items-start max-w-2xl mx-auto bg-vue-black-soft rounded-lg p-2">
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
import type { ClientBoundWebSocketMessage, ClientMessage as Message, ServerBoundWebSocketMessage } from "../../shared";
import { useRoute } from "vue-router";
import "floating-vue/dist/style.css";
import { MsgEndpointSchema } from "../../shared/schemas.ts";

const route = useRoute();
const messages = ref<Message[]>([]);
const input = ref("");
const chatContainer = ref<HTMLElement | null>(null);
const isAtBottom = ref(true);

let ws: WebSocket;
const send = (data: ServerBoundWebSocketMessage) => ws.send(JSON.stringify(data));

const scrollToBottom = () => {
  if(chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

const checkIfAtBottom = () => {
  if(chatContainer.value) {
    const { scrollTop, scrollHeight, clientHeight } = chatContainer.value;
    isAtBottom.value = scrollTop + clientHeight >= scrollHeight - 10;
  }
};

const getToolIcon = (toolName: string) => {
  switch(toolName.toLowerCase()) {
    case "eval":
      return BracesIcon;
    case "weather":
      return CloudLightningIcon;
    default:
      return HammerIcon;
  }
};

onMounted(async() => {
  ws = new WebSocket(`ws://${window.location.host}/api/chat/${route.params.id}`);
  ws.onmessage = (event: MessageEvent<string>) => {
    if(!isValidJSON(event.data)) return;
    const msg = JSON.parse(event.data) as ClientBoundWebSocketMessage;

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
        // Handle tool result if needed
      }
    }

    if(msg.role === "finish") {
      messages.value[messages.value.length - 1].finished = true;
    }

    nextTick(() => {
      highlightCode();
      if(isAtBottom.value) {
        scrollToBottom();
      }
    });
  };

  ws.onclose = (event) => {
    console.log(event);
  };

  const res = await fetch(`/api/chat/${route.params.id}/msgs`);
  if (res.ok) {
    const result = MsgEndpointSchema.safeParse(await res.json());
    if (result.success) messages.value = result.data.map((msg) => ({ ...msg, finished: true }));
  } else {
    // TODO
  }

  if(chatContainer.value) {
    chatContainer.value.addEventListener("scroll", checkIfAtBottom);
  }
});

const sendMessage = () => {
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
};

const handleKeyDown = (e: KeyboardEvent) => {
  if(e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

const parseMarkdown = (text: string) => {
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
};

const highlightCode = () => {
  nextTick(() => {
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
  });
};

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