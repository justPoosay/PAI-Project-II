import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { db } from './database';

export const auth = betterAuth({
  database: mongodbAdapter(db)
});
