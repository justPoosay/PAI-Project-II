import { type } from 'arktype';
import { redis } from 'bun';
import dayjs from 'dayjs';
import Stripe from 'stripe';
import { parse, stringify } from 'superjson';
import type { auth } from './auth';
import { env } from './env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const StripeSubCache = type.or(
  { status: "'none'" },
  {
    subscriptionId: 'string',
    status:
      "'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'paused' | 'trialing' | 'unpaid'",
    priceId: 'string',
    currentPeriodStart: 'number.epoch',
    currentPeriodEnd: 'number.epoch',
    cancelAtPeriodEnd: 'boolean',
    paymentMethod: type({
      brand: 'string | null',
      last4: 'string | null'
    }).or('null')
  }
);
export type StripeSubCache = typeof StripeSubCache.infer;

export const StripeLimitsCache = type({
  messagesUsed: 'number',
  refresh: 'Date'
});
export type StripeLimitsCache = typeof StripeLimitsCache.infer;

export async function syncStripeDataToKV(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
    status: 'all',
    expand: ['data.default_payment_method']
  });

  if (subscriptions.data.length === 0) {
    const subData = { status: 'none' } satisfies StripeSubCache;
    await redis.set(`stripe:customer:${customerId}`, stringify(subData));
    return subData;
  }

  const subscription = subscriptions.data[0]!;

  console.dir(subscription, { depth: 3 });

  const subData = {
    subscriptionId: subscription.id,
    status: subscription.status,
    priceId: subscription.items.data[0]!.price.id,
    currentPeriodEnd: subscription.items.data[0]!.current_period_end,
    currentPeriodStart: subscription.items.data[0]!.current_period_start,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    paymentMethod:
      subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
        ? {
            brand: subscription.default_payment_method.card?.brand ?? null,
            last4: subscription.default_payment_method.card?.last4 ?? null
          }
        : null
  } satisfies StripeSubCache;

  await redis.set(`stripe:customer:${customerId}`, stringify(subData));
  return subData;
}

export async function getLimits(user: (typeof auth.$Infer)['Session']['user']) {
  const customerId = await redis.get(`stripe:user:${user.id}`);

  let subData: StripeSubCache = { status: 'none' };

  if (customerId) {
    const out = type('string').pipe.try(
      parse,
      StripeSubCache
    )(await redis.get(`stripe:customer:${customerId}`));
    if (!(out instanceof type.errors)) {
      subData = out;
    }
  }

  const tier = subData.status === 'active' ? ('pro' as const) : ('free' as const);
  let limits: StripeLimitsCache = {
    messagesUsed: 0,
    refresh: (subData.status === 'active'
      ? dayjs.unix(subData.currentPeriodEnd)
      : dayjs(user.createdAt).add(1, 'month')
    ).toDate()
  };
  let updatedLimits = false;

  const out = type('string').pipe.try(
    parse,
    StripeLimitsCache
  )(await redis.get(`user:limits:${user.id}`));

  if (!(out instanceof type.errors)) {
    limits = out;
  } else {
    updatedLimits = true;
  }

  const now = new Date();
  if (limits.refresh < now) {
    let date = dayjs(limits.refresh);
    while (date.isBefore(now)) {
      date = date.add(1, 'month');
    }
    limits = {
      messagesUsed: 0,
      refresh: date.toDate()
    };
    updatedLimits = true;
  }

  if (updatedLimits) {
    await redis.set(`user:limits:${user.id}`, stringify(limits));
  }

  return {
    ...limits,
    tier
  };
}

const allowedEvents: Stripe.Event.Type[] = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'customer.subscription.pending_update_applied',
  'customer.subscription.pending_update_expired',
  'customer.subscription.trial_will_end',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',
  'invoice.upcoming',
  'invoice.marked_uncollectible',
  'invoice.payment_succeeded',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.canceled'
];

export async function processEvent(event: Stripe.Event) {
  if (!allowedEvents.includes(event.type)) {
    return;
  }

  const { customer: customerId } = event.data.object as {
    customer: string;
  };

  if (typeof customerId !== 'string') {
    throw new Error(`Customer ID is not a string.\nEvent type: ${event.type}`);
  }

  return await syncStripeDataToKV(customerId);
}
