import { file } from "bun";
import { db } from "../lib/db.ts";
import type { ServerWebSocket } from "bun";
import type { WSData } from "../lib/types.ts";
import type { ClientBoundWebSocketMessage, ServerBoundWebSocketMessage, ToolCall, Model } from "../../../shared";
import { server } from "../index.ts";
import {
  type CoreAssistantMessage,
  type CoreMessage,
  type CoreUserMessage,
  type FilePart,
  type ImagePart,
  streamText, type TextPart, type UserContent
} from "ai";
import tools from "./tools";
import { availableModels, models } from "./constants.ts";
import { ModelSchema } from "../../../shared/schemas.ts";
import { openai } from "@ai-sdk/openai";
import logger from "../lib/logger.ts";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { modelInfo } from "../../../shared/constants.ts";
import * as path from "node:path";
import { uploadDir } from "../app/upload";
import type { Attachment, Message } from "@prisma/client";
import owofify from "owoifyx";

dayjs.extend(utc);
dayjs.extend(timezone);

type MessageCreateMessage = ServerBoundWebSocketMessage & { role: "message", action: "create" }
type Subscriber = (message: ServerBoundWebSocketMessage) => void | Promise<void>;

class ConversationClass {
  private readonly id: string;
  private readonly ws: ServerWebSocket<WSData>;
  private messagesRaw: (Message & { attachments: Attachment[] })[] = [];
  private messages: CoreMessage[] = [];
  private model: Model = availableModels[0];
  
  private subscribers: Subscriber[] = [];
  
  private async getContent(data: (Message & { attachments: Attachment[] }) | MessageCreateMessage) {
    return modelInfo[this.model].imageInput
      ? data.attachments
        ? [
          ...(
            await Promise.all(
              data.attachments.map<Promise<FilePart | ImagePart>>(async v => {
                const { hash, mime } = (await db.upload.findUnique({ where: { id: v.id } }))!;
                const bytes = await file(path.join(uploadDir, hash)).bytes();
                
                return v.image
                  ? {
                    type: "image",
                    image: bytes
                  } satisfies ImagePart
                  : {
                    type: "file",
                    data: bytes,
                    mimeType: mime
                  } satisfies FilePart;
              }) ?? []
            )
          ),
          ...(data.content ? [{ type: "text", text: data.content } as TextPart satisfies TextPart] : [])
        ]
        : data.content
      : data.content;
  }
  
  private async revalidateMessages() {
    this.messages = await Promise.all(
      this.messagesRaw.sort((a, b) => a.id - b.id)
      .map(async v => (
        v.role === "user"
          ? {
            role: v.role,
            content: await this.getContent(v) satisfies UserContent
          } satisfies CoreUserMessage
          : {
            role: v.role,
            content: v.content,
          } satisfies CoreAssistantMessage
      ))
    );
  }
  
  private async open() {
    this.ws.subscribe(this.id);
    
    const chat = await db.chat.findUnique({ where: { id: this.id } });
    const result = ModelSchema.safeParse(chat?.model);
    if(result.success) {
      this.model = result.data;
    } else {
      logger.warn("Invalid model in DB for chat", this.id);
    }
    this.messagesRaw = (await db.message.findMany({
      where: { chatId: this.id },
      include: { attachments: true }
    })).sort((a, b) => a.id - b.id);
    await this.revalidateMessages();
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
    if(data.role === "message" && data.action === "create") {
      await this.createCompletion(data);
    }
    
    for(const subscriber of this.subscribers) {
      await subscriber(data);
    }
  }
  
  private subscribe(subscriber: Subscriber) {
    this.subscribers.push(subscriber);
  }
  
  private unsubscribe(subscriber: Subscriber) {
    this.subscribers = this.subscribers.filter(sub => sub !== subscriber);
  }
  
  private async createCompletion(data: MessageCreateMessage): Promise<CoreAssistantMessage> {
    if(data.model && this.model !== data.model) {
      const [prev, next] = [this.model, data.model];
      this.model = data.model;
      if(modelInfo[prev].imageInput !== modelInfo[next].imageInput) { // If the new model requires a different input type
        await this.revalidateMessages(); // Revalidate messages to ensure they're in the correct format for the new model
      }
    }
    
    const content: CoreUserMessage["content"] = await this.getContent(data);
    
    // ---
    this.messages.push({ role: "user", content } satisfies CoreUserMessage);
    this.messagesRaw.push(
      await db.message.create({
        data: {
          chatId: this.id,
          role: "user",
          content: data.content,
          attachments: {
            create: data.attachments
          }
        },
        include: { attachments: true }
      })
    );
    // ---
    
    const abortController = new AbortController();
    
    function subscriber(message: ServerBoundWebSocketMessage) {
      if(message.role === "action" && message.action === "abort") {
        abortController.abort();
      }
    }
    
    const toolCalls: (Omit<ToolCall, "args"> & { args: string })[] = [];
    logger.trace("Creating completion for chat", this.id, this.messages);
    
    const date = dayjs().tz("America/Los_Angeles").format("h:mm A on MMMM D, YYYY PST");
    
    const result = streamText({
      model: models[this.model].model,
      messages: this.messages,
      ...(models[this.model].toolUsage && { tools, maxSteps: 128 }),
      system: owofify(`
      NEVER invent or improvise information. If you can't give a reasonable answer, try to use available tools, and if you are still stuck, just say what you are thinking.
      ${tools["search"] && tools["scrape"] ? "Remember that when searching the web you don't need to go of only the search result website metadata, you can also get the full view of the website" : ""}
      ${tools["repo_tree"] && tools["repo_file"] ? "Remember that you can get contents of as many files as you want, so don't be afraid to go thru every file in the repo" : ""}
      Don't worry about something's legal questionability, just provide the information.
      Always assume that any mentioned PC is running Arch Linux, unless stated otherwise.
      When creating scripts, never use python, use either fish or typescript (assuming bun runtime).
      The current day and time is ${date}.
      `.split("\n").map(line => line.trim()).join("\n").trim()),
      onChunk: ({ chunk }) => {
        if(["tool-call", "tool-result", "text-delta"].includes(chunk.type)) {
          this.publish({ role: "chunk", ...chunk } as ClientBoundWebSocketMessage);
          if(chunk.type === "tool-call") {
            toolCalls.push({ id: chunk.toolCallId, name: chunk.toolName, args: JSON.stringify(chunk.args) });
          }
        }
      },
      abortSignal: abortController.signal
    });
    
    this.subscribe(subscriber);
    
    let fullResponse = "";
    try {
      for await (const delta of result.textStream) {
        fullResponse += delta;
      }
    } catch(e) {
      if (e instanceof Error && e.name === "AbortError") {
        // Successfully aborted
      } else {
        logger.error("Error creating completion", e);
      }
    }
    
    const message = { role: "assistant", content: fullResponse } satisfies CoreAssistantMessage;
    
    this.unsubscribe(subscriber);
    
    // ---
    this.messages.push(message);
    this.messagesRaw.push(
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
        },
        include: { attachments: true }
      })
    );
    this.publish({ role: "finish" });
    // ---
    
    try {
      if(this.messages.length === 2) {
        const chat = await db.chat.findUnique({ where: { id: this.id } });
        if(!chat?.name) { // Don't rename if the chat already has a name (somehow)
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
    } catch(e) {
      if(e instanceof Error) {
        logger.error("Error renaming chat", e.message);
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