<template>
  <div class="flex h-screen bg-vue-black">
    <!-- Sidebar -->
    <Sidebar/>

    <!-- Chat Area -->
    <div class="flex-1 flex flex-col">
      <!-- Chat Messages -->
      <div class="flex-1 overflow-y-auto p-4">
        <div class="max-w-2xl mx-auto">
          <div v-for="(group, groupIndex) in groupedMessages" :key="groupIndex" class="mb-2">
            <div
                v-for="(message, messageIndex) in group"
                :key="message.id"
                :class="[
                'mb-1 last:mb-0',
                message.isMe ? 'flex justify-end' : 'flex justify-start'
              ]"
            >
              <div
                  :class="[
                  'max-w-[70%] p-3 relative',
                  message.isMe
                    ? 'bg-teal-600 text-vue-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl'
                    : 'bg-vue-black-mute text-vue-white-soft rounded-tl-2xl rounded-tr-2xl rounded-br-2xl',
                  messageIndex === group.length - 1 ? 'mb-1' : 'mb-0.5'
                ]"
              >
                <div v-html="parseMarkdown(message.text)" class="markdown-content"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="border-t border-vue-black-mute p-4">
        <div class="flex items-start max-w-2xl mx-auto">
          <button class="p-2 rounded-full hover:bg-vue-black-mute transition mt-1">
            <PaperclipIcon class="w-6 h-6 text-vue-white-soft"/>
          </button>
          <textarea
              v-model="newMessage"
              @keydown="handleKeyDown"
              placeholder="Type a message... (Markdown supported)"
              class="flex-1 bg-vue-black-soft text-vue-white border-vue-black-mute rounded-lg px-4 py-2 mx-2 focus:outline-none focus:ring-2 focus:ring-indigo resize-none"
              rows="3"
          ></textarea>
          <button
              @click="sendMessage"
              class="p-2 bg-indigo text-vue-white rounded-full hover:bg-opacity-80 transition mt-1"
          >
            <SendIcon class="w-6 h-6"/>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { SendIcon, PaperclipIcon } from "lucide-vue-next";
import Sidebar from "@/components/Sidebar.vue";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import DOMPurify from "dompurify";

type Message = { id: number; text: string; isMe: boolean };

const messages = ref<Message[]>([
  { id: 1, text: "Hey there! Here's some **bold** and *italic* text.", isMe: true },
  {
    id: 2,
    text: "Hi! How are you? Here's a code block:\n```javascript\nconsole.log('Hello, world!');\n```",
    isMe: false
  },
  { id: 3, text: "I'm doing great, thanks for asking!", isMe: true },
  { id: 4, text: "That's wonderful to hear!", isMe: false },
  { id: 5, text: "Do you have any plans for the weekend?", isMe: true },
  { id: 6, text: "Not yet, but I'm thinking about going hiking. How about you?", isMe: false },
]);

const groupedMessages = computed(() => {
  return messages.value.reduce((groups, message, index) => {
    const prevMessage = messages.value[index - 1];
    const isSameSender = prevMessage && prevMessage.isMe === message.isMe;
    const group: Message[] = isSameSender ? groups[groups.length - 1] : [];
    group.push(message);
    if(!isSameSender) {
      groups.push(group);
    }
    return groups;
  }, [] as Message[][]);
});

const newMessage = ref("");

const sendMessage = () => {
  if(newMessage.value.trim()) {
    messages.value.push({
      id: messages.value.length + 1,
      text: newMessage.value,
      isMe: true,
    });
    newMessage.value = "";
    nextTick(() => {
      highlightCode();
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
    breaks: true,
    gfm: true,
  });
  return DOMPurify.sanitize(marked(text.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, "")) as string);
};

const highlightCode = () => {
  nextTick(() => {
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightBlock(block as HTMLElement);
    });
  });
};

onMounted(() => {
  highlightCode();
});
</script>

<style>
/* Add some basic styling for Markdown elements */
.markdown-content
{
  word-break : break-word;
}

.markdown-content .hljs
{
  background    : #1e1e1e;
  color         : #d4d4d4;
  border-radius : 0.5rem;
  padding       : 1rem;
  margin        : 0.5rem 0;
}

.markdown-content strong
{
  font-weight : bold;
}

.markdown-content em
{
  font-style : italic;
}

.markdown-content code:not(.hljs)
{
  background-color : rgba(255, 255, 255, 0.1);
  border-radius    : 0.25rem;
  padding          : 0.1rem 0.25rem;
  font-family      : monospace;
}

.markdown-content pre
{
  margin-top    : 0.5rem;
  margin-bottom : 0.5rem;
}

.markdown-content pre code
{
  background-color : transparent;
  padding          : 0;
}
</style>