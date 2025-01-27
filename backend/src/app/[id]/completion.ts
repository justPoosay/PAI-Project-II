import type { AppRequest } from "../../lib/types.ts";
import { object, string } from "zod";
import { ModelSchema } from "../../../../shared/schemas.ts";
import { ConversationService } from "../../lib/database";
import { randomUUIDv7 } from "bun";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { type CoreMessage, streamText } from "ai";
import { models } from "../../core/constants.ts";
import tools from "../../core/tools";
import logger from "../../lib/logger.ts";

dayjs.extend(utc);
dayjs.extend(timezone);

const Options = object({
  message: string().nonempty(),
  model: ModelSchema.optional(),
  attachmentIds: string().array().optional(),
});

interface IError {
  title: string;
  message: string;
}

export async function GET(req: AppRequest): Promise<Response> {
  const c = await ConversationService.findOne(req.route.params.id, { archived: false });
  const { data: opts } = Options.safeParse(req.route.query);
  if(!c) return new Response(null, { status: 404 });
  if(!opts) return new Response(null, { status: 400 });
  
  c.messages.push({ id: randomUUIDv7(), role: "user", content: opts.message });
  c.model = opts.model ?? c.model;
  
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  const messages = c.messages.map(({ role, ...rest }) => ({
    role,
    content: "content" in rest
      ? rest.content
      : rest.chunks.filter(v => v.type === "text-delta").map((v) => v.textDelta).join(""),
  } satisfies CoreMessage));
  const date = dayjs().tz("America/Los_Angeles").format("h:mm A on MMMM D, YYYY PST");
  const chunks: Extract<typeof c["messages"] extends (infer U)[] ? U : never, { role: "assistant" }>["chunks"] = [];
  
  const comp = streamText({
    model: models[c.model].model,
    messages,
    ...(models[c.model].toolUsage && { tools, maxSteps: 128 }),
    system: `
      NEVER invent or improvise information. If you can't give a reasonable answer, try to use available tools, and if you are still stuck, just say what you are thinking.
      ${tools["search"] && tools["scrape"] ? "Remember that when searching the web you don't need to go of only the search result website metadata, you can also get the full view of the website" : ""}
      ${tools["repo_tree"] && tools["repo_file"] ? "Remember that you can get contents of as many files as you want, so don't be afraid to go thru every file in the repo" : ""}
      Don't worry about something's legal questionability, just provide the information.
      Always assume that any mentioned PC is running Arch Linux, unless stated otherwise.
      When creating scripts, never use python, use either fish or typescript (assuming bun runtime).
      The current day and time is ${date}.
      `.split("\n").map(line => line.trim()).join("\n").trim(),
    onChunk({ chunk }) {
      if(["tool-call", "tool-result", "text-delta"].includes(chunk.type)) {
        chunks.push(chunk as Extract<typeof chunk, { type: "tool-call" | "tool-result" | "text-delta" }>);
        writer.write(chunk);
      }
    },
    abortSignal: req.signal,
  });
  
  const res = new Response(stream.readable, {
    headers: {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    },
  });
  
  const promise = new Promise<void>(async function(resolve) {
    let encounteredError: IError | null = null;
    try {
      for await (const delta of comp.textStream) {}
    } catch(e) {
      if(e instanceof Error && e.name === "AbortError") {
        // Successfully aborted
      } else if(e instanceof Error) {
        encounteredError = {
          title: "Error creating completion",
          message: e.name + ": " + e.message,
        };
        logger.error(encounteredError);
        await writer.abort(encounteredError);
      }
    }
    await writer.close();
    
    c.messages.push({ id: randomUUIDv7(), role: "assistant", chunks });
    
    resolve();
  });
  
  Promise.allSettled([comp, promise]).catch((e) => void (e instanceof Error && writer.abort({
    title: "Error creating completion",
    message: e.name + ": " + e.message,
  } satisfies IError)));
  
  return res;
}