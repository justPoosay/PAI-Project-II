import { type } from 'arktype';
import { Conversation, Model } from 'common';
import { ConversationService } from '../../lib/database';
import type { AppRequest } from '../../lib/types';
import { isValidJSON } from '../../lib/utils';

export async function pre(req: AppRequest): Promise<Response | null> {
  const c = await ConversationService.findOne(req.route.params.id!, { archived: false });
  if (!c) return new Response(null, { status: 404 });
  return null;
}

export async function DELETE(req: AppRequest): Promise<Response> {
  await ConversationService.update(req.route.params.id!, { archived: true });
  return new Response(null, { status: 204 });
}

export async function PATCH(req: AppRequest): Promise<Response> {
  const userSuppliedData = await req.text();
  if (!isValidJSON(userSuppliedData)) return new Response(null, { status: 400 });
  const out = type({
    'name?': 'string | null',
    'model?': Model
  })(JSON.parse(userSuppliedData));
  if (out instanceof type.errors) return new Response(null, { status: 400 });
  const updated = await ConversationService.update(req.route.params.id!, out);
  return Response.json(
    Conversation.assert({ ...updated, updated_at: updated?.updated_at.toISOString() })
  );
}
