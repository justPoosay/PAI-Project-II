import { redis } from 'bun';
import { Router } from 'express';
import { stringify } from 'superjson';
import { env } from '../lib/env';
import logger from '../lib/logger';
import { getLimits, stripe } from '../lib/stripe';

export const stripeRouter = Router();

// trpc.stripe.createCheckoutSession -> { url: string }
stripeRouter.get('/create-checkout-session', async (req, res) => {
  if (!req.session?.user) {
    return void res.status(401).send();
  }

  try {
    let customerId = await redis.get(`stripe:user:${req.session.user.id}`);

    if (!customerId) {
      const newCustomer = await stripe.customers.create({
        email: req.session.user.email,
        metadata: {
          userId: req.session.user.id
        }
      });

      await redis.set(`stripe:user:${req.session.user.id}`, newCustomer.id);
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

    res.send(stringify({ url: session.url }));
  } catch (err) {
    logger.error(`[GET /create-checkout-session] ${err}`);
    res.status(500).send();
  }
});

// trpc.stripe.createPortalSession -> { url: string }
stripeRouter.get('/create-portal-session', async (req, res) => {
  if (!req.session?.user) {
    return void res.status(401).send();
  }

  try {
    const customerId = await redis.get(`stripe:user:${req.session.user.id}`);
    if (!customerId) {
      return void res.status(403).send();
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.BASE_URL}/settings`
    });

    res.send(stringify({ url: session.url }));
  } catch (err) {
    logger.error(`[GET /create-portal-session] ${err}`);
    res.status(500).send();
  }
});

// trpc.stripe.getPrice -> { id: string, unitAmount: number, currency: string, interval: string }
stripeRouter.get('/price', async (_, res) => {
  try {
    const price = await stripe.prices.retrieve(env.STRIPE_PRICE_ID);
    if (!price) {
      return void res.status(404).send();
    }

    res.send(
      stringify({
        id: price.id,
        unitAmount: price.unit_amount!,
        currency: price.currency,
        interval: price.recurring?.interval
      })
    );
  } catch (err) {
    logger.error(`[GET /price] ${err}`);
    res.status(500).send();
  }
});

// trpc.stripe.getLimits -> { messagesUsed: number; refresh: Date; tier: 'free' | 'pro' }
stripeRouter.get('/limits', async (req, res) => {
  if (!req.session?.user) {
    return void res.status(401).send();
  }

  try {
    const limits = await getLimits(req.session.user);
    res.send(stringify(limits));
  } catch (err) {
    logger.error(`[GET /limits] ${err}`);
    res.status(500).send();
  }
});
