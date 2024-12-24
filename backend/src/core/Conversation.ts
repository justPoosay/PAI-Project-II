import { db } from "../lib/db.ts";
import type { ServerWebSocket } from "bun";
import type { WSData } from "../lib/types.ts";
import type { ClientBoundWebSocketMessage, ServerBoundWebSocketMessage } from "../../../shared";
import OpenAI from "openai";
import { server } from "../index.ts";
import { type CoreAssistantMessage, type CoreMessage, type CoreUserMessage, streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { type TOOLS, tools } from "./tools";

class ConversationClass {
  private readonly client = new OpenAI();
  private readonly id: string;
  private readonly ws: ServerWebSocket<WSData>;
  private messages: CoreMessage[] = [];
  
  private async init() {
    const existing = await db.chat.findUnique({ where: { id: this.id } });
    if(!existing) return db.chat.create({ data: { id: this.id } });
    
    // this.messages = await db.message.findMany({ where: { chatId: this.id } });
  }
  
  async close() {
    this.ws.unsubscribe(this.id);
  }
  
  private publish(message: ClientBoundWebSocketMessage) {
    server.publish(this.id, JSON.stringify(message));
  }
  
  constructor(ws: ServerWebSocket<WSData>) {
    this.id = ws.data.id;
    this.ws = ws;
    
    ws.subscribe(this.id);
    
    this.init().then();
  }
  
  async onMessage(data: ServerBoundWebSocketMessage) {
    if(data.role === "message" && data.action === "create") {
      await this.createCompletion(data.content);
    }
  }
  
  private async createCompletion(userInput: string): Promise<CoreAssistantMessage> {
    // ---
    this.messages.push({ role: "user", content: userInput } satisfies CoreUserMessage);
    await db.message.create({ data: { chat_id: this.id, role: "user", content: userInput } });
    // ---
    
    const result = streamText({
      model: openai("gpt-4o"),
      messages: this.messages,
      tools,
      maxSteps: 16, // nice round number
      onChunk: ({ chunk }) => {
        if(["tool-call", "tool-result", "text-delta"].includes(chunk.type)) {
          this.publish({ role: "chunk", ...chunk } as ClientBoundWebSocketMessage);
          console.log(chunk);
        }
      }
    });
    
    let fullResponse = "";
    for await (const delta of result.textStream) {
      fullResponse += delta;
    }
    
    const message = { role: "assistant", content: fullResponse } satisfies CoreAssistantMessage;
    
    // ---
    this.messages.push(message);
    await db.message.create({ data: { chat_id: this.id, ...message } });
    this.publish({ role: "finish" });
    // ---
    
    this.messages.length = 0; // REMOVE ME
    return message;
  }
}

export type TConversation = ConversationClass;

interface ConversationClassConstructor {
  new(chatID: string): ConversationClass;
  
  (chatID: string): ConversationClass;
}

const Conversation = function(this: ConversationClass | void, ws: ServerWebSocket<WSData>) {
  return new ConversationClass(ws);
};

Conversation.prototype = ConversationClass.prototype;

export default Conversation;