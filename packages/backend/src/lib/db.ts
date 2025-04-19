import { type, type Type } from 'arktype';
import { logger } from 'better-auth';
import { randomUUIDv7 } from 'bun';
import { Conversation, Message } from 'common';
import { MongoClient, ObjectId, type Filter, type OptionalUnlessRequiredId } from 'mongodb';
import { env } from './utils';

const mongoClient = new MongoClient(env.DATABASE_URL);
export const db = mongoClient.db('assistant');

export async function closeDB() {
  await mongoClient.close();
  logger.info('MongoDB connection closed');
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
function serviceFactory<S extends Type<{}, {}>>(collectionName: string, schema: S) {
  type T = S['inferOut'];

  function parse(data: unknown): T | null {
    if (!data) {
      return null;
    }

    const out = schema(data);
    if (out instanceof type.errors) {
      return null;
    }
    return out;
  }

  const collection = db.collection<T>(collectionName);

  return Object.freeze({
    async findOne<U extends Filter<T>>(where: U): Promise<Extract<T, U> | null> {
      const entity = await collection.findOne(where);
      return parse(entity) as Extract<T, U> | null;
    },
    async find<U extends Filter<T>>(where: U = {} as U): Promise<Extract<T, U>[]> {
      const entities = await collection.find(where).toArray();
      return entities.map(parse).filter((v): v is Extract<T, U> => v !== null);
    },
    async create<U extends T>(
      data: Omit<U, 'id' | 'created_at' | 'updated_at'> &
        (U extends { id: string } ? { id?: string } : { _id?: ObjectId })
    ): Promise<U> {
      const now = new Date();
      const obj: any = { ...data, created_at: now, updated_at: now }; // eslint-disable-line @typescript-eslint/no-explicit-any

      if (schema.extends({ id: 'string' }) && !obj.id) obj.id = randomUUIDv7();

      await collection.insertOne(schema.assert(obj) as OptionalUnlessRequiredId<T>);
      return obj as U;
    },
    async update<
      U extends O extends true ? T : Partial<T>,
      F extends Filter<T>,
      O extends boolean = false
    >(where: F, data: U, overwrite: O = false as O): Promise<Extract<T, U & F> | null> {
      const now = new Date();
      const obj: typeof data & { updated_at: Date } = { ...data, updated_at: now };

      const value = overwrite
        ? await collection.findOneAndReplace(where, obj, { returnDocument: 'after' })
        : await collection.findOneAndUpdate(where, { $set: obj }, { returnDocument: 'after' });

      return parse(value) as Extract<T, U & F> | null;
    },
    async delete(where: Filter<T>): Promise<void> {
      await collection.deleteOne(where);
    },
    _schema: schema
  } as const);
}

export const ConversationService = serviceFactory(
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
