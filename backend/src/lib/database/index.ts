import { MongoClient } from "mongodb";
import { env } from "../utils";
import ConversationServiceClass from "./services/ConversationService";

const mongoClient: MongoClient = new MongoClient(env.DATABASE_URL);

export async function connectToDatabase() {
  await mongoClient.connect();
}

export const ConversationService = new ConversationServiceClass(mongoClient);