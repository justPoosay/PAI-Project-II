import { routes } from 'shared';
import { availableModels } from '~/core/constants';

export async function GET(): Promise<Response> {
  return Response.json(routes['models'].parse(availableModels));
}
