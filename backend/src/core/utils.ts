import { type CoreMessage, generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function nameChat(context: CoreMessage[]) {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: "Based on the messages provided, create a name up to 20 characters long describing the chat.",
    prompt: JSON.stringify(context),
  });
  return text;
}