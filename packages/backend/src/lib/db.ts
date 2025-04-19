import { type, type Type } from 'arktype';
import { Conversation, Message } from 'common';
import { MongoClient, type Filter, type OptionalUnlessRequiredId } from 'mongodb';
import logger from './logger';
import { env } from './utils';

const mongoClient = new MongoClient(env.DATABASE_URL);
export const db = mongoClient.db('assistant');

export async function closeDB() {
  await mongoClient.close();
  logger.info('MongoDB connection closed');
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
function createService<S extends Type<{}, {}>>(collectionName: string, schema: S) {
  type T = S['inferOut'];

  function parse(data: unknown): T | null {
    if (!data) {
      return null;
    }

    const out = schema(data);
    if (out instanceof type.errors) {
      logger.warn('MongoDB schema validation error', collectionName, out.summary);
      return null;
    }
    return out;
  }

  const collection = db.collection<T>(collectionName);

  return Object.freeze({
    async findOne<U extends Filter<T>>(where: U): Promise<Extract<T, Pick<U, keyof T>> | null> {
      const entity = await collection.findOne(where);
      return parse(entity) as Extract<T, Pick<U, keyof T>> | null;
    },
    async find<U extends Filter<T>>(where: U): Promise<Extract<T, Pick<U, keyof T>>[]> {
      const entities = await collection.find(where).toArray();
      return entities.map(parse).filter((v): v is Extract<T, Pick<U, keyof T>> => v !== null);
    },
    async create<U extends T>(data: U): Promise<U> {
      await collection.insertOne(data as unknown as OptionalUnlessRequiredId<T>);
      return data;
    },
    async update<U extends O extends true ? T : Partial<T>, F extends Filter<T>, O extends boolean>(
      where: F,
      data: U,
      overwrite: O = false as O
    ): Promise<Extract<T, U & F> | null> {
      const value = overwrite
        ? await collection.findOneAndReplace(where, data, { returnDocument: 'after' })
        : await collection.findOneAndUpdate(where, { $set: data }, { returnDocument: 'after' });

      return parse(value) as Extract<T, U & F> | null;
    },
    async delete(where: Filter<T>): Promise<void> {
      await collection.deleteOne(where);
    },
    _schema: schema
  } as const);
}

export const ConversationService = createService(
  'conversations',
  type.or(
    Conversation.and({
      messages: Message.array(),
      deleted: 'false',
      created_at: 'Date'
    }),
    {
      id: 'string',
      deleted: 'true'
    }
  )
);
