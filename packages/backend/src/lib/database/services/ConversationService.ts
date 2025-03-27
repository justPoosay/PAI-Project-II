import { randomUUIDv7 } from 'bun';
import { Db, MongoClient } from 'mongodb';
import { dbName } from '..';
import {
  ConversationDTO,
  ConversationEntity,
  type TConversationDTO
} from '../schemas/ConversationSchemas';

export default class ConversationService {
  #db: Db;

  constructor(mongoClient: MongoClient) {
    this.#db = mongoClient.db(dbName);
  }

  get #collection() {
    return this.#db.collection<typeof ConversationEntity.infer>('conversations');
  }

  async findOne(id: TConversationDTO['id'], where?: Omit<Partial<TConversationDTO>, 'id'>) {
    const entity = await this.#collection.findOne({ id, ...where });
    return entity ? ConversationDTO.convertFromEntity(entity) : null;
  }

  async find(where?: Omit<Partial<TConversationDTO>, 'id'>) {
    const entities = await this.#collection.find({ ...where }).toArray();
    return entities.map(ConversationDTO.convertFromEntity).filter(v => v !== null);
  }

  async create(dto: Omit<TConversationDTO, 'id' | 'created_at' | 'updated_at'>) {
    const now = new Date();
    const obj = { ...dto, created_at: now, updated_at: now, id: randomUUIDv7() };
    const candidate = ConversationEntity.assert(obj);
    await this.#collection.insertOne(candidate);
    return ConversationDTO.convertFromEntity(obj)!;
  }

  async update(
    id: TConversationDTO['id'],
    dto: Omit<Partial<TConversationDTO>, 'id' | 'created_at' | 'updated_at'>
  ) {
    const now = new Date();
    const obj = { ...dto, updated_at: now };
    const candidate = ConversationEntity.partial().assert(obj);

    const value = await this.#collection.findOneAndUpdate(
      { id },
      { $set: candidate },
      { returnDocument: 'after' }
    );
    return value ? ConversationDTO.convertFromEntity(value) : null;
  }

  async delete(id: TConversationDTO['id']) {
    await this.#collection.deleteOne({ id });
  }
}
