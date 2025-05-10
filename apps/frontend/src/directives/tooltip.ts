import { type } from 'arktype';
import type { Directive, DirectiveBinding } from 'vue';

const stringSchema = type('string');
const cleanupMap = new WeakMap<HTMLElement, () => void>();
const configSchema = type({
  content: 'string',
  position: "'left' | 'right' | 'bottom' | 'top'"
});
const stateMap = new WeakMap<HTMLElement, { tooltipText: string; preferredPosition: string }>();
const activeTooltipMap = new WeakMap<HTMLElement, HTMLElement>();

const tooltipDirective: Directive<HTMLElement, unknown> = {
  mounted(el, binding: DirectiveBinding<unknown>) {
    const bindingValue = binding.value;

    if (!bindingValue) {
      return;
    }

    const initialState =
      typeof bindingValue === 'string'
        ? { tooltipText: stringSchema.assert(bindingValue), preferredPosition: 'top' }
        : (() => {
            const config = configSchema.assert(bindingValue);
            return { tooltipText: config.content, preferredPosition: config.position };
          })();
    stateMap.set(el, initialState);

    let tooltipEl: HTMLElement | null = null;

    const showTooltip = () => {
      tooltipEl = document.createElement('div');
      activeTooltipMap.set(el, tooltipEl);
      // use latest reactive state
      const { tooltipText, preferredPosition } = stateMap.get(el)!;
      tooltipEl.textContent = tooltipText;
      tooltipEl.className =
        'absolute text-muted px-3 py-1.5 bg-dialog border-border rounded-md pointer-events-none z-[999999999999] select-none opacity-0 transition text-xs font-medium translate-y-1 shadow-sm';
      document.body.appendChild(tooltipEl);
      const elRect = el.getBoundingClientRect();
      const tooltipRect = tooltipEl.getBoundingClientRect();
      const offset = 1;
      const margin = 8;
      let topPos: number;
      let leftPos: number;

      if (preferredPosition === 'top') {
        topPos = elRect.top + window.scrollY - tooltipRect.height - offset;
        const initialLeft = elRect.left + window.scrollX + (elRect.width - tooltipRect.width) / 2;
        const minLeft = window.scrollX + margin;
        const maxLeft = window.scrollX + window.innerWidth - tooltipRect.width - margin;
        leftPos = Math.min(Math.max(initialLeft, minLeft), maxLeft);
      } else if (preferredPosition === 'bottom') {
        topPos = elRect.bottom + window.scrollY + offset;
        const initialLeft = elRect.left + window.scrollX + (elRect.width - tooltipRect.width) / 2;
        const minLeft = window.scrollX + margin;
        const maxLeft = window.scrollX + window.innerWidth - tooltipRect.width - margin;
        leftPos = Math.min(Math.max(initialLeft, minLeft), maxLeft);
      } else if (preferredPosition === 'left') {
        leftPos = elRect.left + window.scrollX - tooltipRect.width - offset;
        const initialTop = elRect.top + window.scrollY + (elRect.height - tooltipRect.height) / 2;
        const minTop = window.scrollY + margin;
        const maxTop = window.scrollY + window.innerHeight - tooltipRect.height - margin;
        topPos = Math.min(Math.max(initialTop, minTop), maxTop);
      } else {
        leftPos = elRect.right + window.scrollX + offset;
        const initialTop = elRect.top + window.scrollY + (elRect.height - tooltipRect.height) / 2;
        const minTop = window.scrollY + margin;
        const maxTop = window.scrollY + window.innerHeight - tooltipRect.height - margin;
        topPos = Math.min(Math.max(initialTop, minTop), maxTop);
      }
      tooltipEl.style.top = `${topPos}px`;
      tooltipEl.style.left = `${leftPos}px`;
      requestAnimationFrame(() => {
        if (!tooltipEl) return;
        tooltipEl.classList.remove('opacity-0');
        tooltipEl.classList.remove('translate-y-1');
      });
    };

    const hideTooltip = () => {
      if (tooltipEl) {
        tooltipEl.classList.add('opacity-0');
        tooltipEl.classList.add('translate-y-1');
        const elToRemove = tooltipEl;
        elToRemove.addEventListener(
          'transitionend',
          () => {
            if (elToRemove.parentElement) {
              elToRemove.parentElement.removeChild(elToRemove);
            }
            activeTooltipMap.delete(el);
            if (tooltipEl === elToRemove) {
              tooltipEl = null;
            }
          },
          { once: true }
        );
      }
    };

    el.addEventListener('mouseenter', showTooltip);
    el.addEventListener('mouseleave', hideTooltip);

    cleanupMap.set(el, () => {
      el.removeEventListener('mouseenter', showTooltip);
      el.removeEventListener('mouseleave', hideTooltip);
      hideTooltip();
    });
  },
  updated(el, binding: DirectiveBinding<unknown>) {
    const bindingValue = binding.value;
    if (!bindingValue) return;
    const newState =
      typeof bindingValue === 'string'
        ? { tooltipText: stringSchema.assert(bindingValue), preferredPosition: 'top' }
        : (() => {
            const config = configSchema.assert(bindingValue);
            return { tooltipText: config.content, preferredPosition: config.position };
          })();
    stateMap.set(el, newState);
    const active = activeTooltipMap.get(el);
    if (active) {
      const { tooltipText, preferredPosition } = newState;
      active.textContent = tooltipText;
      const elRect = el.getBoundingClientRect();
      const tooltipRect = active.getBoundingClientRect();
      const offset = 1;
      const margin = 8;
      let topPos: number;
      let leftPos: number;
      if (preferredPosition === 'top') {
        topPos = elRect.top + window.scrollY - tooltipRect.height - offset;
        const initialLeft = elRect.left + window.scrollX + (elRect.width - tooltipRect.width) / 2;
        const minLeft = window.scrollX + margin;
        const maxLeft = window.scrollX + window.innerWidth - tooltipRect.width - margin;
        leftPos = Math.min(Math.max(initialLeft, minLeft), maxLeft);
      } else if (preferredPosition === 'bottom') {
        topPos = elRect.bottom + window.scrollY + offset;
        const initialLeft = elRect.left + window.scrollX + (elRect.width - tooltipRect.width) / 2;
        const minLeft = window.scrollX + margin;
        const maxLeft = window.scrollX + window.innerWidth - tooltipRect.width - margin;
        leftPos = Math.min(Math.max(initialLeft, minLeft), maxLeft);
      } else if (preferredPosition === 'left') {
        leftPos = elRect.left + window.scrollX - tooltipRect.width - offset;
        const initialTop = elRect.top + window.scrollY + (elRect.height - tooltipRect.height) / 2;
        const minTop = window.scrollY + margin;
        const maxTop = window.scrollY + window.innerHeight - tooltipRect.height - margin;
        topPos = Math.min(Math.max(initialTop, minTop), maxTop);
      } else {
        leftPos = elRect.right + window.scrollX + offset;
        const initialTop = elRect.top + window.scrollY + (elRect.height - tooltipRect.height) / 2;
        const minTop = window.scrollY + margin;
        const maxTop = window.scrollY + window.innerHeight - tooltipRect.height - margin;
        topPos = Math.min(Math.max(initialTop, minTop), maxTop);
      }
      active.style.top = `${topPos}px`;
      active.style.left = `${leftPos}px`;
    }
  },
  unmounted(el) {
    const cleanup = cleanupMap.get(el);
    if (cleanup) {
      cleanup();
      cleanupMap.delete(el);
    }
  }
};

export default tooltipDirective;
