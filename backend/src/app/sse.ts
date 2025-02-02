import { emitter } from "../index";

const encoder = new TextEncoder();

export async function GET() {
  let listener: Parameters<typeof emitter.on<"sse">>[1];
  
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

        controller.enqueue(encoder.encode("event: ping\ndata: connected\n\n"));

        listener = data => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        emitter.on("sse", listener);
      },
      cancel() {
        emitter.off("sse", listener);
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