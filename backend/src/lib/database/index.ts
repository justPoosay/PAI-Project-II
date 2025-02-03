import { MongoClient } from "mongodb";
import { env } from "../utils";
import ConversationServiceClass from "./services/ConversationService";

const mongoClient: MongoClient = new MongoClient(env.DATABASE_URL);
export const dbName = "assistant";

export async function closeDB() {
  await mongoClient.close();
}

export const ConversationService = new ConversationServiceClass(mongoClient);