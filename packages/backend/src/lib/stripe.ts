import { redis } from 'bun';
import Stripe from 'stripe';
import { stringify } from 'superjson';
import { env } from './env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function syncStripeDataToKV(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
    status: 'all',
    expand: ['data.default_payment_method']
  });

  if (subscriptions.data.length === 0) {
    const subData = { status: 'none' };
    await redis.set(`stripe:customer:${customerId}`, stringify(subData));
    return subData;
  }

  const subscription = subscriptions.data[0]!;

  const subData = {
    subscriptionId: subscription.id,
    status: subscription.status,
    priceId: subscription.items.data[0]!.price.id,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    paymentMethod:
      subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
        ? {
            brand: subscription.default_payment_method.card?.brand ?? null,
            last4: subscription.default_payment_method.card?.last4 ?? null
          }
        : null
  };

  await redis.set(`stripe:customer:${customerId}`, stringify(subData));
  return subData;
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
