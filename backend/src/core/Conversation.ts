import { db } from "../lib/db.ts";
import type { ServerWebSocket } from "bun";
import type { WSData } from "../lib/types.ts";
import type { ClientBoundWebSocketMessage, ServerBoundWebSocketMessage, ToolCall, Model } from "../../../shared";
import { server } from "../index.ts";
import { type CoreAssistantMessage, type CoreMessage, type CoreUserMessage, streamText } from "ai";
import tools from "./tools";
import { models } from "./constants.ts";
import { ModelSchema } from "../../../shared/schemas.ts";
import { defaultModel } from "../../../shared/constants.ts";
import { openai } from "@ai-sdk/openai";
import logger from "../lib/logger.ts";

class ConversationClass {
  private readonly id: string;
  private readonly ws: ServerWebSocket<WSData>;
  private messages: CoreMessage[] = [];
  private model: Model = defaultModel;
  
  private async open() {
    this.ws.subscribe(this.id);
    
    const messages = await db.message.findMany({ where: { chatId: this.id } });
    this.messages = messages.sort((a, b) => a.id - b.id).map(({ role, content }) => ({ role, content }));
    const chat = await db.chat.findUnique({ where: { id: this.id } });
    const result = ModelSchema.safeParse(chat?.model);
    if(result.success) {
      this.model = result.data;
    } else {
      logger.warn("Invalid model in DB for chat", this.id);
    }
    
    this.publish({ role: "setup", model: this.model });
  }
  
  async close() {
    this.ws.unsubscribe(this.id);
  }
  
  private publish(message: ClientBoundWebSocketMessage) {
    logger.trace("publish@" + this.id, message);
    server.publish(this.id, JSON.stringify(message));
  }
  
  constructor(ws: ServerWebSocket<WSData>) {
    this.id = ws.data.id;
    this.ws = ws;
    
    this.open().then();
  }
  
  async onMessage(data: ServerBoundWebSocketMessage) {
    if(data.role === "modify" && data.action === "model") {
      this.model = data.model;
      await db.chat.update({ where: { id: this.id }, data: { model: data.model } });
      this.publish({ role: "ack" });
    }
    
    if(data.role === "message" && data.action === "create") {
      await this.createCompletion(data.content);
    }
  }
  
  private async createCompletion(userInput: string): Promise<CoreAssistantMessage> {
    // ---
    this.messages.push({ role: "user", content: userInput } satisfies CoreUserMessage);
    await db.message.create({ data: { chatId: this.id, role: "user", content: userInput } });
    // ---
    
    const toolCalls: (Omit<ToolCall, "args"> & { args: string })[] = [];
    const result = streamText({
      model: models[this.model].model,
      messages: this.messages,
      ...(models[this.model].supportsTools && { tools, maxSteps: 32 }),
      onChunk: ({ chunk }) => {
        if(["tool-call", "tool-result", "text-delta"].includes(chunk.type)) {
          this.publish({ role: "chunk", ...chunk } as ClientBoundWebSocketMessage);
          if(chunk.type === "tool-call") {
            toolCalls.push({ id: chunk.toolCallId, name: chunk.toolName, args: JSON.stringify(chunk.args) });
          }
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
    await db.message.create({
      data: {
        chatId: this.id,
        ...message,
        ...(toolCalls.length && {
          toolCalls: {
            create: toolCalls
          }
        }),
        author: this.model
      }
    });
    this.publish({ role: "finish" });
    // ---
    
    if(this.messages.length === 2) {
      const chat = await db.chat.findUnique({ where: { id: this.id } });
      if(!chat?.name) { // Don't rename if the chat already has a name
        const result = streamText({
          model: openai("gpt-4o-mini"),
          system: "Based on the messages provided, create a name up to 20 characters long describing the chat. Don't wrap your response in quotes.",
          prompt: JSON.stringify(this.messages),
        });
        let name = "";
        for await (const delta of result.textStream) {
          name += delta;
          this.publish({ role: "rename", name });
        }
        await db.chat.update({ where: { id: this.id }, data: { name } });
      }
    }
    
    return message;
  }
}

export type TConversation = ConversationClass;

const Conversation = function(this: ConversationClass | void, ws: ServerWebSocket<WSData>) {
  return new ConversationClass(ws);
};

Conversation.prototype = ConversationClass.prototype;

export default Conversation;