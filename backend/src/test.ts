// // // // import OpenAI from "openai";
// // // //
// // // // const client = new OpenAI();
// // // //
// // // // const stream = await client.chat.completions.create({
// // // //   messages: [{ role: "user", content: "Write a react component for a todo app" }],
// // // //   model: "gpt-4o",
// // // //   stream: true
// // // // });
// // // //
// // // // let streaming = false;
// // // // let message = "";
// // // //
// // // // setTimeout(() => stream.controller.abort(), 5000);
// // // //
// // // // for await (const chunk of stream) {
// // // //   const content = chunk.choices[0]?.delta?.content || "";
// // // //   if (!content) {
// // // //     streaming = !streaming;
// // // //     console.log(Bun.color("yellow", "ansi")! + streaming + Bun.color("white", "ansi"));
// // // //   }
// // // //   message += content;
// // // //   console.log(JSON.stringify(content));
// // // // }
// // // //
// // // // console.log(message);
// // //
// // // import { openai } from "@ai-sdk/openai";
// // // import { type CoreMessage, streamText } from "ai";
// // // import * as readline from "node:readline/promises";
// // // import { tools } from "./core/tools";
// // // import { anthropic } from "@ai-sdk/anthropic";
// // //
// // // const terminal = readline.createInterface({
// // //   input: process.stdin,
// // //   output: process.stdout,
// // // });
// // //
// // // const messages: CoreMessage[] = [];
// // //
// // // async function main() {
// // //   while(true) {
// // //     const userInput = await terminal.question("You: ");
// // //
// // //     messages.push({ role: "user", content: userInput });
// // //
// // //     const result = streamText({
// // //       // model: openai("gpt-4o"),
// // //       model: anthropic("claude-3-5-sonnet-latest"),
// // //       messages,
// // //       tools,
// // //       maxSteps: 5,
// // //       // onStepFinish: step => {
// // //       //   console.log({ onStepFinish: omit(step, ["request", "response"]) });
// // //       // },
// // //       // onChunk: ({ chunk }) => {
// // //       //   console.log({ onChunk: chunk });
// // //       // }
// // //     });
// // //
// // //     let fullResponse = "";
// // //     process.stdout.write("\nAssistant: ");
// // //     for await (const delta of result.textStream) {
// // //       fullResponse += delta;
// // //       process.stdout.write(delta);
// // //     }
// // //     process.stdout.write("\n\n");
// // //
// // //     console.log(await result.text);
// // //
// // //     messages.push({ role: "assistant", content: fullResponse });
// // //   }
// // // }
// // //
// // // main().catch(console.error);
// //
// // import FirecrawlApp from "@mendable/firecrawl-js";
// //
// // const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY, apiUrl: process.env.FIRECRAWL_API_URL });
// //
// // const result = await app.scrapeUrl("https://vuejs.org", {
// //   formats: ["markdown", "html"]
// // });
// //
// // if (result.success) {
// //   console.log(result);
// // }
//
// import { env } from "./lib/utils.ts";
// const baseUrl = "https://www.searchapi.io/api/v1"
//
// const res = await fetch(`${baseUrl}/me?api_key=${env.SEARCH_API_KEY}`);
// console.log(await res.json());

// import type { CoreMessage } from "ai";
//
// const message = {
//   role: "user", content: [{
//     type: "image",
//     image: "https://example.com/image.jpg"
//   }]
// } satisfies CoreMessage;

import { CryptoHasher } from "bun";

const buffer = new Uint8Array([1, 2, 3, 4, 5, 6]);
const hash = new CryptoHasher("sha256").update(buffer).digest("base64");

console.log(hash);