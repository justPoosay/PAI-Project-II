import { logger } from 'better-auth';
import { MongoClient } from 'mongodb';
import { env } from '../utils';

const mongoClient = new MongoClient(env.DATABASE_URL);
export const db = mongoClient.db('assistant');

export async function closeDB() {
  await mongoClient.close();
  logger.info('MongoDB connection closed');
}
