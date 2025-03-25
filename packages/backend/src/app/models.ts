import { routes } from 'common';
import { getAvailableModels } from '~/core/utils';

export async function GET(): Promise<Response> {
  return Response.json(routes['models'].parse(getAvailableModels()));
}
