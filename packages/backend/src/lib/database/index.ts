import { MongoClient } from 'mongodb';
import ConversationServiceClass from '~/lib/database/services/ConversationService';
import { env } from '~/lib/utils';

const mongoClient: MongoClient = new MongoClient(env.DATABASE_URL);
export const dbName = 'assistant';

export async function closeDB() {
  await mongoClient.close();
}

export const ConversationService = new ConversationServiceClass(mongoClient);
