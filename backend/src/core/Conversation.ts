import type { ServerWebSocket } from "bun";
import type { WSData } from "../lib/types.ts";
import type { ClientBoundWebSocketMessage, ServerBoundWebSocketMessage } from "../../../shared";
import { server } from "../index.ts";
import {
  type CoreMessage,
  streamText,
} from "ai";
import tools from "./tools";
import { models } from "./constants.ts";
import { openai } from "@ai-sdk/openai";
import logger from "../lib/logger.ts";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { errorMessage, modelInfo } from "../../../shared/constants.ts";
import { type ConversationDTO } from "../lib/database/schemas/ConversationSchemas";
import { ConversationService } from "../lib/database";
import { randomUUIDv7 } from "bun";

dayjs.extend(utc);
dayjs.extend(timezone);

type MessageCreateMessage = ServerBoundWebSocketMessage & { role: "message", action: "create" }
type Subscriber = (message: ServerBoundWebSocketMessage) => void | Promise<void>;

type Chunk = Extract<
  Parameters<NonNullable<Parameters<typeof streamText>[0]["onChunk"]>>[0]["chunk"],
  { type: "tool-call" | "tool-result" | "text-delta" }
>;

class ConversationClass {
  private readonly id: string;
  private readonly ws: ServerWebSocket<WSData>;
  private c: ConversationDTO = null!;
  
  private subscribers: Subscriber[] = [];
  
  private get coreMessages() {
    return this.c.messages.map(({ role, ...rest }) => ({
      role,
      content: "content" in rest
        ? rest.content
        : rest.chunks.filter(v => v.type === "text-delta").map((v) => v.textDelta).join(""),
    } satisfies CoreMessage));
  }
  
  private async open() {
    this.ws.subscribe(this.id);
    this.c = (await ConversationService.findOne(this.id))!;
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
  
  private async createCompletion(data: MessageCreateMessage) {
    if(data.model && this.c.model !== data.model) {
      const [prev, next] = [this.c.model, data.model];
      this.c.model = data.model;
      if(modelInfo[prev].imageInput !== modelInfo[next].imageInput) {
      }
    }
    
    // ---
    this.c.messages.push({ role: "user", content: data.content, id: randomUUIDv7() });
    await ConversationService.update(this.id, { messages: this.c.messages });
    // ---
    
    const abortController = new AbortController();
    
    function subscriber(message: ServerBoundWebSocketMessage) {
      if(message.role === "action" && message.action === "abort") {
        abortController.abort();
      }
    }
    
    logger.trace("Creating completion for chat", this.id);
    
    const date = dayjs().tz("America/Los_Angeles").format("h:mm A on MMMM D, YYYY PST");
    const model = this.c.model;
    const chunks: Chunk[] = [];
    const result = streamText({
      model: models[model].model,
      messages: this.coreMessages,
      ...(models[model].toolUsage && { tools, maxSteps: 128 }),
      system: `
      NEVER invent or improvise information. If you can't give a reasonable answer, try to use available tools, and if you are still stuck, just say what you are thinking.
      ${tools["search"] && tools["scrape"] ? "Remember that when searching the web you don't need to go of only the search result website metadata, you can also get the full view of the website" : ""}
      ${tools["repo_tree"] && tools["repo_file"] ? "Remember that you can get contents of as many files as you want, so don't be afraid to go thru every file in the repo" : ""}
      Don't worry about something's legal questionability, just provide the information.
      Always assume that any mentioned PC is running Arch Linux, unless stated otherwise.
      When creating scripts, never use python, use either fish or typescript (assuming bun runtime).
      The current day and time is ${date}.
      `.split("\n").map(line => line.trim()).join("\n").trim(),
      onChunk: ({ chunk }) => {
        if(["tool-call", "tool-result", "text-delta"].includes(chunk.type)) {
          this.publish({ role: "chunk", ...chunk } as ClientBoundWebSocketMessage);
          chunks.push(chunk as Chunk);
        }
      },
      abortSignal: abortController.signal,
    });
    
    this.subscribe(subscriber);
    
    let fullResponse = "";
    let encounteredError: Omit<Extract<ClientBoundWebSocketMessage, { role: "error" }>, "role"> | null = null;
    try {
      for await (const delta of result.textStream) {
        fullResponse += delta;
      }
    } catch(e) {
      if(e instanceof Error && e.name === "AbortError") {
        // Successfully aborted
      } else if(e instanceof Error) {
        encounteredError = {
          title: "Error creating completion",
          message: e.name + ": " + e.message,
          pof: "createCompletion()",
        };
        console.error(encounteredError);
        if(!fullResponse) {
          fullResponse = errorMessage(encounteredError);
          this.publish({
            role: "chunk",
            type: "text-delta",
            textDelta: fullResponse,
          });
        }
        this.publish({
          role: "error",
          ...encounteredError,
        });
      }
    }
    
    this.unsubscribe(subscriber);
    
    // ---
    this.c.messages.push({ role: "assistant", chunks, author: model, id: randomUUIDv7() });
    await ConversationService.update(this.id, { messages: this.c.messages });
    this.publish({ role: "finish" });
    // ---
    
    if(!encounteredError) {
      try {
        if(this.c.messages.length >= 2) {
          if(!this.c?.name) {
            const result = streamText({
              model: openai("gpt-4o-mini"),
              system: "Based on the messages provided, create a name up to 20 characters long describing the chat. Don't wrap your response in quotes. If these messages are not enough to create a descriptive name, or its just a greeting of some sort, reply with 'null' (without quotes).",
              prompt: JSON.stringify(this.coreMessages),
            });
            let name = "";
            for await (const delta of result.textStream) {
              name += delta;
              if(name !== "null") {
                this.publish({ role: "rename", name });
              }
            }
            if(name !== "null") {
              this.c.name = name;
              await ConversationService.update(this.id, { name });
            }
          }
        }
      } catch(e) {
        if(e instanceof Error) {
          logger.error("Error renaming chat", e.message);
          this.publish({
            role: "error",
            title: "Error renaming chat",
            message: e.name + ": " + e.message,
            pof: "createCompletion",
          });
        }
      }
    }
  }
}

export type TConversation = ConversationClass;

const Conversation = function(this: ConversationClass | void, ws: ServerWebSocket<WSData>) {
  return new ConversationClass(ws);
};

Conversation.prototype = ConversationClass.prototype;

export default Conversation;