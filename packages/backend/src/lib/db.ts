import { type, type Type } from 'arktype';
import { Conversation, Message } from 'common';
import type { Merge } from 'common/utils';
import {
  MongoClient,
  ObjectId,
  type DeleteResult,
  type Filter,
  type OptionalUnlessRequiredId,
  type WithId
} from 'mongodb';
import { env } from './env';
import logger from './logger';

const mongoClient = new MongoClient(env.DATABASE_URL);
export const db = mongoClient.db('assistant');

export async function closeDB() {
  await mongoClient.close();
  logger.info('MongoDB connection closed');
}

type Fallback<T, U> = T extends never ? U : T;

function createService<A extends Type<object, object>>(collectionName: string, schema: A) {
  type T = A['inferOut'];

  const collection = db.collection<T>(collectionName);

  return Object.freeze({
    async findOne<S extends Filter<T>>(
      where: S
    ): Promise<WithId<Fallback<Extract<T, Pick<S, keyof T>>, T>> | null> {
      const entity = await collection.findOne(where);
      return schema.allows(entity)
        ? (entity as WithId<Fallback<Extract<T, Pick<S, keyof T>>, T>>)
        : null;
    },
    async find<S extends Filter<T>>(
      where: S
    ): Promise<WithId<Fallback<Extract<T, Pick<S, keyof T>>, T>>[]> {
      const entities = await collection.find(where).toArray();
      return entities.filter(schema.allows) as WithId<Fallback<Extract<T, Pick<S, keyof T>>, T>>[];
    },
    async insertOne<S extends OptionalUnlessRequiredId<T>>(data: S): Promise<WithId<S>> {
      const { insertedId } = await collection.insertOne(data);

      return {
        ...data,
        _id: insertedId
      } as WithId<S>;
    },
    async insertMany<S extends OptionalUnlessRequiredId<T>>(data: S[]): Promise<WithId<S>[]> {
      const { insertedIds } = await collection.insertMany(data);

      return data.map((d, i) => ({
        ...d,
        _id: insertedIds[i]
      })) as WithId<S>[];
    },
    async updateOne<
      S extends Filter<T>,
      U extends V extends true ? T : Partial<T>,
      V extends boolean
    >(
      where: S,
      dataOrCB: U | ((prev: WithId<Fallback<Extract<T, Pick<S, keyof T>>, T>> | null) => U),
      replace: V = false as V
    ): Promise<WithId<Fallback<Extract<T, Pick<Merge<S, U>, keyof T>>, T>> | null> {
      const data = typeof dataOrCB === 'function' ? dataOrCB(await this.findOne(where)) : dataOrCB;

      const value = replace
        ? await collection.findOneAndReplace(where, data, { returnDocument: 'after' })
        : await collection.findOneAndUpdate(where, { $set: data }, { returnDocument: 'after' });

      return schema.allows(value)
        ? (value as WithId<Fallback<Extract<T, Pick<Merge<S, U>, keyof T>>, T>>)
        : null;
    },
    deleteOne(where: Filter<T>): Promise<DeleteResult> {
      return collection.deleteOne(where);
    },
    deleteMany(where: Filter<T>): Promise<DeleteResult> {
      return collection.deleteMany(where);
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
