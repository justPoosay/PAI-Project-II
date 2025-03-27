import { routes } from 'common';
import { ConversationService } from '../../lib/database';
import type { AppRequest } from '../../lib/types';

export async function GET(req: AppRequest): Promise<Response> {
  const { id } = req.route.params;
  const c = await ConversationService.findOne(id!, { archived: false });
  return Response.json(routes['[id]']['messages'].assert(c?.messages ?? []));
}
