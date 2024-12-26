import type { AppRequest } from "../../lib/types.ts";
import { db } from "../../lib/db.ts";
import { routes } from "../../../../shared/schemas.ts";

export async function GET(req: AppRequest): Promise<Response> {
  const { id } = req.route.params;
  const result = await db.message.findMany({
    where: { chatId: id, Chat: { active: true } },
    include: { toolCalls: true }
  });
  return Response.json(
    routes["[id]"]["messages.json"].parse( // To make sure the backend crashes if it doesn't provide the data client expects
      result.map(({ toolCalls: calls, ...message }) => {
        const toolCalls = calls.length
          ? calls.map(({ args, ...rest }) => ({ args: JSON.parse(args), ...rest }))
          : undefined;
        return { ...message, ...(toolCalls && { toolCalls }) };
      })
    )
  );
}