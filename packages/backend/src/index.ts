import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import { redis } from 'bun';
import cors from 'cors';
import express from 'express';
import { ObjectId } from 'mongodb';
import type Stripe from 'stripe';
import SuperJSON from 'superjson';
import { auth } from './lib/auth';
import { env } from './lib/env';
import logger from './lib/logger';
import { processEvent, stripe, syncStripeDataToKV } from './lib/stripe';
import { chatRouter } from './routers/chat.router';
import { completionRouter } from './routers/completion.router';
import { modelRouter } from './routers/model.router';
import { stripeRouter } from './routers/stripe.router';

SuperJSON.registerCustom<ObjectId, string>(
  {
    isApplicable: v => v instanceof ObjectId,
    serialize: v => v.toHexString(),
    deserialize: v => new ObjectId(v)
  },
  'ObjectId'
);

const app = express();

app.all(/\/api\/auth\/.*/, toNodeHandler(auth));

app.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    logger.warn('[STRIPE WEBHOOK] No signature provided');
    return void res.status(400).send('Webhook Error: No signature provided');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error(`[STRIPE WEBHOOK] Error verifying webhook signature: ${err}`);
    return void res.status(400).send(`Webhook Error: ${err}`);
  }

  logger.debug(`[STRIPE WEBHOOK] Received event: ${event.type}`);
  try {
    await processEvent(event);
    logger.debug(`[STRIPE WEBHOOK] Successfully processed event: ${event.type}`);
  } catch (err) {
    logger.error(`[STRIPE WEBHOOK] Error processing event ${event.type}: ${err}`);
  }

  res.json({ received: true });
});

app.use(
  async (req, _, next) => {
    req.session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });
    next();
  },
  express.json(),
  cors({
    origin: env.BASE_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }),
  (req, _, next) => {
    logger.info(`[${req.method}] ${req.url} by ${req.session?.user?.email ?? null}`);
    next();
  }
);

app.get('/success', async (req, res) => {
  if (!req.session?.user) {
    return res.redirect('/');
  }

  const stripeCustomerId = await redis.get(`stripe:user:${req.session.user.id}`);
  if (!stripeCustomerId) {
    return res.redirect('/');
  }

  await syncStripeDataToKV(stripeCustomerId);
  return res.redirect('/');
});

app.use('/chat', chatRouter);
app.use('/completion', completionRouter);
app.use('/model', modelRouter);
app.use('/stripe', stripeRouter);

app.listen(3000, () => {
  logger.info('Server is running on http://localhost:3000');
});
