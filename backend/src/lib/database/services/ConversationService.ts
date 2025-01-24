import { MongoClient, Db, ObjectId } from "mongodb";
import { ConversationDTO, type ConversationEntity, conversationEntitySchema } from "../schemas/ConversationSchemas";
import { dbName } from "../index.ts";

export default class ConversationService {
  #db: Db;
  
  constructor(mongoClient: MongoClient) {
    this.#db = mongoClient.db(dbName);
  }
  
  get #collection() {
    return this.#db.collection<ConversationEntity>("conversations");
  }
  
  async findOne(id: ConversationDTO["id"], where?: Omit<Partial<ConversationDTO>, "id">) {
    const entity = await this.#collection.findOne({ _id: new ObjectId(id), ...where });
    return entity ? ConversationDTO.convertFromEntity(entity) : null;
  }
  
  async find(where?: Omit<Partial<ConversationDTO>, "id">) {
    const entities = await this.#collection.find({ ...where }).toArray();
    return entities.map(ConversationDTO.convertFromEntity);
  }
  
  async create(dto: Omit<ConversationDTO, "id" | "created_at" | "updated_at">) {
    const now = new Date();
    const obj = { ...dto, created_at: now, updated_at: now };
    const candidate = conversationEntitySchema.parse({
      ...obj,
      _id: new ObjectId(),
    });
    const { insertedId: _id } = await this.#collection.insertOne(candidate);
    return ConversationDTO.convertFromEntity({ ...obj, _id });
  }
  
  async update(id: ConversationDTO["id"], dto: Omit<Partial<ConversationDTO>, "id" | "created_at" | "updated_at">) {
    const now = new Date();
    const obj = { ...dto, created_at: now, updated_at: now };
    const candidate = conversationEntitySchema.partial().parse(obj);
    
    const value = await this.#collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: candidate },
      { returnDocument: "after" },
    );
    return value ? ConversationDTO.convertFromEntity(value) : null;
  }
  
  async delete(id: ConversationDTO["id"]) {
    await this.#collection.deleteOne({ _id: new ObjectId(id) });
  }
}