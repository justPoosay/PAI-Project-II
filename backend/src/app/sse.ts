import { emitter } from "../index";

const encoder = new TextEncoder();

export async function GET() {
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            "HTTP/1.1 200 OK\r\n" +
            "Content-Type: text/event-stream\r\n" +
            "Cache-Control: no-cache\r\n" +
            "Connection: keep-alive\r\n\r\n",
          ),
        );
        emitter.on("sse", (data) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)));
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    },
  );
}