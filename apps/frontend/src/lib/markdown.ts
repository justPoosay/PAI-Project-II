import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import markedKatex from 'marked-katex-extension';
import { Lru } from './lru';

const codeCache = new Lru<string, string>(100);
const markdownCache = new Lru<string, string>(500);

function hash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

export const highlight = (code: string, lang?: string) => {
  const key = hash(`${lang}-${code}`);
  const cached = codeCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const highlighted = DOMPurify.sanitize(
    lang
      ? hljs.getLanguage(lang)
        ? hljs.highlight(code, { language: lang }).value
        : hljs.highlightAuto(code).value
      : hljs.highlightAuto(code).value
  );
  codeCache.set(key, highlighted);
  return highlighted;
};

const marked = new Marked({
  gfm: true,
  breaks: true,
  extensions: [
    {
      name: 'callout',
      level: 'block',
      start(src) {
        return src.match(/^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|ERROR)]/)?.index;
      },
      tokenizer(src) {
        const match = src.match(
          /^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|ERROR)]([^\n]*)(\n(?:>.*\n?)*)?/
        );
        if (!match) return;
        const [raw, kind, title, body] = match;
        return {
          type: 'callout',
          raw,
          kind: kind?.toLowerCase(),
          title: title?.trim() || kind,
          body: body?.replace(/^>\s?/gm, '')
        };
      },
      renderer(token): string {
        const inner = marked.parse(token['body'], { async: false });
        return `
          <blockquote data-type="${token['kind']}">
            <p class="callout-title">${token['title']}</p>
            ${inner}
          </blockquote>
        `;
      }
    }
  ]
});

marked.use(markedKatex({ throwOnError: false, nonStandard: true, output: 'mathml' }));
marked.use(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight
  })
);

export function splitMarkdown(text: string, chunkSize = 500): string[] {
  const lines = text.split(/\n/g);
  const chunks: string[] = [];
  let current = '';
  let fence = '';
  let indent = 0;

  for (const line of lines) {
    indent = line.match(/^ */)?.[0]?.length || 0;

    const m = line.match(/^ *(`{3,}|~{3,})/);
    if (m?.[1]) {
      fence = fence === m[1] ? '' : m[1];
      if (!indent) {
        if (fence) {
          chunks.push(current);
          current = line + '\n';
        } else {
          chunks.push(current + line + '\n');
          current = '';
        }
      }
      continue;
    }

    if (fence || indent) {
      current += line + '\n';
      continue;
    }

    if (current.length + line.length + 1 > chunkSize) {
      chunks.push(current);
      current = line + '\n';
    } else {
      current += line + '\n';
    }
  }

  if (current !== '') {
    chunks.push(current);
  }
  return chunks;
}

export function parseMarkdown(md: string) {
  if (!md) {
    return '';
  }
  const chunks = splitMarkdown(md, 1000);
  let content = '';
  for (const chunk of chunks) {
    const key = hash(chunk);
    const cached = markdownCache.get(key);
    if (cached !== undefined) {
      content += cached;
      continue;
    }

    const html = marked.parse(chunk, { async: false });
    markdownCache.set(key, html);
    content += html;
  }
  return content;
}
