import type { trpc } from './trpc';
import type { ART } from './types';

export const messagesPerMonth: Record<ART<typeof trpc.stripe.getLimits.query>['tier'], number> = {
  free: parseInt(import.meta.env['VITE_MESSAGES_PER_MONTH_FREE']),
  pro: parseInt(import.meta.env['VITE_MESSAGES_PER_MONTH_PAID'])
};
