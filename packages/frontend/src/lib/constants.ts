import type { routes } from './api';

export const messagesPerMonth: Record<
  (typeof routes)['GET /stripe/limits']['o']['inferOut']['tier'],
  number
> = {
  free: parseInt(import.meta.env['VITE_MESSAGES_PER_MONTH_FREE']),
  pro: parseInt(import.meta.env['VITE_MESSAGES_PER_MONTH_PAID'])
};
