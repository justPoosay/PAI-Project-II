import { routes } from '/shared/schemas';
import { ConversationService } from '~/lib/database';

export async function GET(): Promise<Response> {
  const cs = await ConversationService.find({ archived: false });
  return Response.json(
    routes['conversations'].parse(
      cs
        .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
        .map(({ updated_at, ...c }) => ({ ...c, updated_at: updated_at.toISOString() }))
    )
  );
}
