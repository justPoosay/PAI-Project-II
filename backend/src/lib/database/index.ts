import { MongoClient } from "mongodb";
import { env } from "../utils";
import ConversationServiceClass from "./services/ConversationService";

const mongoClient: MongoClient = new MongoClient(env.DATABASE_URL);
export const dbName = "assistant";

export const ConversationService = new ConversationServiceClass(mongoClient);