import hljs from 'highlight.js';
import { Marked, Renderer } from 'marked';
import { markedHighlight } from 'marked-highlight';
import { capitalize } from './utils';
import markedKatex from 'marked-katex-extension';
import DOMPurify from 'dompurify';

const stock = new Marked(); // for parsing blockquotes
const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      return lang
        ? hljs.getLanguage(lang)
          ? hljs.highlight(code, { language: lang }).value
          : hljs.highlightAuto(code).value
        : hljs.highlightAuto(code).value;
    }
  })
);

const renderer = new Renderer();

renderer.blockquote = function ({ text, raw }) {
  const match = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|ERROR)]/);
  if (match) {
    const type = match[1].toLowerCase();
    const title = capitalize(type);
    return `<blockquote data-type="${type}">${text
      .replace(match[0], title)
      .split('\n')
      .filter(Boolean)
      .map(v => {
        const isTitle = v === title;
        return `<p${isTitle ? ' class="callout-title"' : ''}>${isTitle ? v : stock.parse(v, { async: false })}</p>`;
      })
      .join('\n')}</blockquote>`;
  }
  return stock.parse(raw, { async: false });
};

marked.use({ renderer });
marked.use(markedKatex({ throwOnError: false, nonStandard: true, output: 'mathml' }));

// ---

const markdownCache = new Map<string, string>();

export function parseMarkdown(text: string, strict = true) {
  if (markdownCache.has(text)) {
    return markdownCache.get(text);
  }

  const parsed = DOMPurify.sanitize(
    marked.parse(text.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ''), {
      async: false,
      breaks: true,
      gfm: true
    }),
    strict
      ? {}
      : {
          ADD_ATTR: ['onclick']
        }
  );

  markdownCache.set(text, parsed);
  return parsed;
}
