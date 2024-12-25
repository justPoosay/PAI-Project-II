import type { AppRequest } from "../../../lib/types.ts";
import { db } from "../../../lib/db.ts";
import { MsgEndpointSchema } from "../../../../../shared/schemas.ts";

export async function GET(req: AppRequest): Promise<Response> {
  const messages = await db.message.findMany({ where: { chatId: req.route.params.id }, include: { toolCalls: true } });
  const result = MsgEndpointSchema.safeParse(
    messages.map(({ toolCalls: calls, ...message }) => {
      const toolCalls = calls.length
        ? calls.map(({ args, ...rest }) => ({ args: JSON.parse(args), ...rest }))
        : undefined;
      return { ...message, ...(toolCalls && { toolCalls }) };
    })
  );
  
  if(result.success) return Response.json(result.data);
  else {
    console.error(result.error);
    return new Response("Internal Server Error", { status: 500 });
  }
}