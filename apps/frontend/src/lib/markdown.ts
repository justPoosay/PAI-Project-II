import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import { marked, Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import markedKatex from 'marked-katex-extension';
import { Lru } from './lru';

const codeCache = new Lru<string, string>(100);
const markdownCache = new Lru<string, string>(100);

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

const _marked = new Marked({
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
      renderer(token) {
        const inner = marked(token['body'], { async: false });
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

_marked.use(markedKatex({ throwOnError: false, nonStandard: true, output: 'mathml' }));
_marked.use(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight
  })
);

export function parseMarkdown(md: string, strict = true) {
  if (!md) {
    return '';
  }
  const key = hash(md);
  const cached = markdownCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const html = _marked.parse(md.replace(/^[\u200B-\uFEFF]/, ''), { async: false });
  const clean = DOMPurify.sanitize(html, strict ? {} : { ADD_ATTR: ['onclick'] });

  markdownCache.set(key, clean);
  return clean;
}
