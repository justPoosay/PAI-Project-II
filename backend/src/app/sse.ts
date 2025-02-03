import { emitter } from "..";

const encoder = new TextEncoder();

export async function GET() {
  let listener: Parameters<typeof emitter.on<"sse">>[1];

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("Content-Type: text/event-stream\n" + "Cache-Control: no-cache\n" + "Connection: keep-alive\n\n"));

      listener = (data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {}
      };
      emitter.on("sse", listener);
    },
    cancel() {
      emitter.off("sse", listener);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
