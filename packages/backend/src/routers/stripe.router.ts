import { Router } from 'express';

export const stripeRouter = Router();

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
