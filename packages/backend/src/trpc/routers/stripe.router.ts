import { TRPCError } from '@trpc/server';
import { redis } from 'bun';
import { env } from '../../lib/env';
import { getLimits, stripe } from '../../lib/stripe';
import { protectedProcedure, router } from '../trpc';

export const stripeRouter = router({
  createCheckoutSession: protectedProcedure.query(async ({ ctx }) => {
    let customerId = await redis.get(`stripe:user:${ctx.auth.user.id}`);

    if (!customerId) {
      const newCustomer = await stripe.customers.create({
        email: ctx.auth.user.email,
        metadata: {
          userId: ctx.auth.user.id
        }
      });

      await redis.set(`stripe:user:${ctx.auth.user.id}`, newCustomer.id);
      customerId = newCustomer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      success_url: `${env.BASE_URL}/api/success`,
      cancel_url: `${env.BASE_URL}/`,
      mode: 'subscription',
      line_items: [
        {
          price: env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      ui_mode: 'hosted'
    });

    return { url: session.url! };
  }),
  createPortalSession: protectedProcedure.query(async ({ ctx }) => {
    const customerId = await redis.get(`stripe:user:${ctx.auth.user.id}`);
    if (!customerId) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.BASE_URL}/settings`
    });

    return { url: session.url };
  }),
  getLimits: protectedProcedure.query(async ({ ctx }) => getLimits(ctx.auth.user))
});
