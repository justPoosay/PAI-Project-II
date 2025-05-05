import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { redis } from 'bun';
import { ObjectId } from 'mongodb';
import { ChatService, db } from './db';
import { env } from './env';

export const auth = betterAuth({
  database: mongodbAdapter(db),
  baseURL: env.BASE_URL,
  socialProviders: {
    github: {
      enabled: true,
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET
    }
  },
  user: {
    deleteUser: {
      enabled: true,
      async afterDelete(user) {
        await ChatService.deleteMany({ userId: new ObjectId(user.id) });
        await redis.del(`user:limits:${user.id}`);
        const customerId = await redis.get(`stripe:user:${user.id}`);
        if (customerId) {
          await redis.del(`stripe:user:${user.id}`);
          await redis.del(`stripe:customer:${customerId}`);
        }
      }
    }
  }
});
