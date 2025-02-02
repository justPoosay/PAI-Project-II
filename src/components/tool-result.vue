<template>
  <template v-if="['scrape', 'search', 'repo_tree'].includes(tool.name)">
    <!-- Scrape tool -->
    <div v-if="tool.name === 'scrape' && typeof tool.result === 'object'">
      <div v-if="!(tool.result.success ?? false)"
           class="inline-flex items-center space-x-2 text-red-500">
        <CircleAlertIcon class="w-4 h-4" />
        <p>{{ tool.result.error }}</p>
      </div>
      <div v-else v-html="parseMarkdown(tool.result.markdown)" class="markdown-content" />
    </div>
    <!-- Search tool -->
    <div v-if="tool.name === 'search' && typeof tool.result === 'object'">
      <div v-if="!(tool.result.success ?? true)"
           class="inline-flex items-center space-x-2 text-red-500">
        <CircleAlertIcon class="w-4 h-4" />
        <p>{{ tool.result.error }}</p>
      </div>
      <div v-else class="flex flex-col space-y-2">
        <div v-if="tool.result.zci" class="border-y border-y-white/30 p-2">
          <a class="text-xl font-bold hover:underline" :href="tool.result.zci.url">{{
              tool.result.zci.title }}</a>
          <p>{{ tool.result.zci.text }}</p>
        </div>
        <div v-for="result in tool.result.results" class="inline-flex flex-col">
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
    <div v-if="tool.name === 'repo_tree' && typeof tool.result === 'string'">
      <pre>{{ tool.result }}</pre>
    </div>
  </template>
  <pre v-else><code class="hljs">{{ objectToString(tool.result).trim() }}</code></pre>
</template>

<script setup lang="ts">
import { parseMarkdown } from "@/lib/markdown.ts";
import { CircleAlertIcon } from "lucide-vue-next";

defineProps<{
  tool: {
    name: string;
    result: any;
  }
}>();

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
</script>