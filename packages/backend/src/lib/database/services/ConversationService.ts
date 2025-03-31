import { randomUUIDv7 } from 'bun';
import { db } from '..';
import {
  ConversationDTO,
  ConversationEntity,
  type TConversationDTO
} from '../schemas/ConversationSchemas';

export class ConversationService {
  static get #collection() {
    return db.collection<typeof ConversationEntity.infer>('conversations');
  }

  static async findOne(id: TConversationDTO['id'], where?: Omit<Partial<TConversationDTO>, 'id'>) {
    const entity = await this.#collection.findOne({ id, ...where });
    return entity ? ConversationDTO.convertFromEntity(entity) : null;
  }

  static async find(where?: Omit<Partial<TConversationDTO>, 'id'>) {
    const entities = await this.#collection.find({ ...where }).toArray();
    return entities.map(ConversationDTO.convertFromEntity).filter(v => v !== null);
  }

  static async create(dto: Omit<TConversationDTO, 'id' | 'created_at' | 'updated_at'>) {
    const now = new Date();
    const obj = { ...dto, created_at: now, updated_at: now, id: randomUUIDv7() };
    const candidate = ConversationEntity.assert(obj);
    await this.#collection.insertOne(candidate);
    return ConversationDTO.convertFromEntity(obj)!;
  }

  static async update(
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

  static async delete(id: TConversationDTO['id']) {
    await this.#collection.deleteOne({ id });
  }
}
