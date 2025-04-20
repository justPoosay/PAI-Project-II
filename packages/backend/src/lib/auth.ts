import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { db } from './db';
import { env } from './utils';

export const auth = betterAuth({
  database: mongodbAdapter(db),
  socialProviders: {
    github: {
      enabled: true,
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET
    }
  },
  user: {
    additionalFields: {
      tier: {
        type: 'string',
        defaultValue: 'free'
      }
    }
  }
});
