// import { Router } from 'express';

// export const stripeRouter = Router();

/**
 * GET /create-checkout-session
 * GET /create-portal-session
 * GET /price
 * GET /limits
 */

// export const stripeRouter = router({
//   createCheckoutSession: protectedProcedure.query(async ({ ctx }) => {
//     let customerId = await redis.get(`stripe:user:${ctx.auth.user.id}`);

//     if (!customerId) {
//       const newCustomer = await stripe.customers.create({
//         email: ctx.auth.user.email,
//         metadata: {
//           userId: ctx.auth.user.id
//         }
//       });

//       await redis.set(`stripe:user:${ctx.auth.user.id}`, newCustomer.id);
//       customerId = newCustomer.id;
//     }

//     const session = await stripe.checkout.sessions.create({
//       customer: customerId,
//       success_url: `${env.BASE_URL}/api/success`,
//       cancel_url: `${env.BASE_URL}/`,
//       mode: 'subscription',
//       line_items: [
//         {
//           price: env.STRIPE_PRICE_ID,
//           quantity: 1
//         }
//       ],
//       ui_mode: 'hosted'
//     });

//     return { url: session.url! };
//   }),
//   createPortalSession: protectedProcedure.query(async ({ ctx }) => {
//     const customerId = await redis.get(`stripe:user:${ctx.auth.user.id}`);
//     if (!customerId) {
//       throw new TRPCError({ code: 'FORBIDDEN' });
//     }

//     const session = await stripe.billingPortal.sessions.create({
//       customer: customerId,
//       return_url: `${env.BASE_URL}/settings`
//     });

//     return { url: session.url };
//   }),
//   getPrice: publicProcedure.query(async () => {
//     const price = await stripe.prices.retrieve(env.STRIPE_PRICE_ID);
//     if (!price) {
//       throw new TRPCError({ code: 'NOT_FOUND' });
//     }

//     return {
//       id: price.id,
//       unitAmount: price.unit_amount!,
//       currency: price.currency,
//       interval: price.recurring?.interval
//     };
//   }),
//   getLimits: protectedProcedure.query(async ({ ctx }) => getLimits(ctx.auth.user))
// });

import { Router, type Request, type Response, type NextFunction } from 'express';
import { stripe } from '../lib/stripe';
import  { redis } from 'bun';
import { env } from '../lib/env';
import { getLimits } from '../lib/stripe';

export const stripeRouter = Router();

/**
 * GET /create-checkout-session
 * GET /create-portal-session
 * GET /price
 * GET /limits
 */

stripeRouter.get('/create-checkout-session', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let customerId = await redis.get(`stripe:user:${req.user.id}`);

    if (!customerId) {
      const newCustomer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          userId: req.user.id
        }
      });

      await redis.set(`stripe:user:${req.user.id}`, newCustomer.id);
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

    return res.json({ url: session.url! });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

stripeRouter.get('/create-portal-session', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = await redis.get(`stripe:user:${req.user.id}`);
    if (!customerId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.BASE_URL}/settings`
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
});

stripeRouter.get('/price', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const price = await stripe.prices.retrieve(env.STRIPE_PRICE_ID);
    if (!price) {
      return res.status(404).json({ error: 'Price not found' });
    }

    return res.json({
      id: price.id,
      unitAmount: price.unit_amount!,
      currency: price.currency,
      interval: price.recurring?.interval
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to retrieve price' });
  }
});

stripeRouter.get('/limits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limits = await getLimits(req.user);
    return res.json(limits);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to get limits' });
  }
});
