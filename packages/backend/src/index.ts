import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { logger } from 'better-auth';
import { redis, type Serve } from 'bun';
import { auth } from './lib/auth';
import { env } from './lib/env';
import { processEvent, stripe, syncStripeDataToKV } from './lib/stripe';
import { appRouter as router } from './trpc';
import { createContext } from './trpc/context';

export default {
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname.startsWith('/success')) {
      const session = await auth.api.getSession(req);
      if (!session?.user) {
        return Response.redirect('/', 302);
      }

      const stripeCustomerId = await redis.get(`stripe:user:${session.user.id}`);
      if (!stripeCustomerId) {
        return Response.redirect('/', 302);
      }

      await syncStripeDataToKV(stripeCustomerId);
      return Response.redirect('/', 302);
    }

    if (url.pathname.startsWith('/stripe')) {
      const body = await req.text();
      const signature = req.headers.get('Stripe-Signature');

      if (!signature) return Response.json({ error: 'No signature provided' }, { status: 400 });

      try {
        if (typeof signature !== 'string') {
          throw new Error("Header isn't a string???");
        }

        const event = await stripe.webhooks.constructEventAsync(body, signature, env.STRIPE_WEBHOOK_SECRET);

        await processEvent(event);
      } catch (e) {
        logger.error('[STRIPE HOOK] Error processing event', e);
      }

      return Response.json({ received: true });
    }

    if (url.pathname.startsWith('/api/auth')) {
      return auth.handler(req);
    }

    return fetchRequestHandler({
      endpoint: '/trpc',
      req,
      createContext,
      router
    });
  }
} satisfies Serve;
