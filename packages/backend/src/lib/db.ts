import { type, type Type } from 'arktype';
import { Conversation, Message } from 'common';
import {
  MongoClient,
  ObjectId,
  type Filter,
  type OptionalUnlessRequiredId,
  type WithId
} from 'mongodb';
import logger from './logger';
import type { Merge } from './types';
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

  const collection = db.collection<T>(collectionName);

  return Object.freeze({
    async findOne<U extends Filter<T>>(
      where: U
    ): Promise<WithId<Extract<T, Pick<U, keyof T>>> | null> {
      const entity = await collection.findOne(where);
      return schema.allows(entity) ? (entity as WithId<Extract<T, Pick<U, keyof T>>>) : null;
    },
    async find<U extends Filter<T>>(where: U): Promise<WithId<Extract<T, Pick<U, keyof T>>>[]> {
      const entities = await collection.find(where).toArray();
      return entities.filter(schema.allows) as WithId<Extract<T, Pick<U, keyof T>>>[];
    },
    async create<U extends T>(data: U): Promise<WithId<U>> {
      const { insertedId } = await collection.insertOne(
        data as unknown as OptionalUnlessRequiredId<T>
      );

      return {
        ...data,
        _id: insertedId
      } as WithId<U>;
    },
    async update<U extends O extends true ? T : Partial<T>, F extends Filter<T>, O extends boolean>(
      where: F,
      data: U,
      overwrite: O = false as O
    ): Promise<WithId<Extract<T, Pick<Merge<F, U>, keyof T>>> | null> {
      const value = overwrite
        ? await collection.findOneAndReplace(where, data, { returnDocument: 'after' })
        : await collection.findOneAndUpdate(where, { $set: data }, { returnDocument: 'after' });

      return schema.allows(value)
        ? (value as WithId<Extract<T, Pick<Merge<F, U>, keyof T>>>)
        : null;
    },
    async delete(where: Filter<T>): Promise<void> {
      await collection.deleteOne(where);
    },
    _schema: schema
  } as const);
}

export const ConversationService = createService(
  'conversations',
  type
    .or(
      Conversation.omit('id').and({
        messages: Message.array(),
        deleted: 'false'
      }),
      {
        deleted: 'true'
      }
    )
    .and({
      userId: type.instanceOf(ObjectId)
    })
);
