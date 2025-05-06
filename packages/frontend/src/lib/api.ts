import { type, type Type } from 'arktype';
import ObjectId from 'bson-objectid';
import { Chat } from 'common';
import { omit } from 'common/utils';
import { err, ok, type Result } from 'neverthrow';
import SuperJSON, { parse } from 'superjson';

SuperJSON.registerCustom<ObjectId, string>(
  {
    isApplicable: v => v instanceof ObjectId,
    serialize: v => v.toHexString(),
    deserialize: v => new ObjectId(v)
  },
  'ObjectId'
);

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type RouteString = `${Method} /${string}`;

const routes = {
  'DELETE /chat/:id': {
    i: type({ id: 'string' }),
    o: type({ success: 'boolean' })
  },
  'GET /chat/': {
    o: type({
      _id: type.instanceOf(ObjectId),
      name: Chat.get('name'),
      pinned: 'boolean',
      updatedAt: 'Date'
    })
  }
} as const satisfies Record<RouteString, { i?: Type<unknown, object>; o: Type<unknown, object> }>;

type Routes = typeof routes;
type InputOf<K extends keyof Routes> = Routes[K] extends { i: Type<infer I, object> } ? I : never;
type OutputOf<K extends keyof Routes> = Routes[K]['o']['inferOut'];

export async function query<K extends keyof Routes>(
  route: K,
  ...args: InputOf<K> extends never ? [] : [input: InputOf<K>]
): Promise<Result<OutputOf<K>, string>> {
  const [method, path] = route.split(' ') as [Method, string];
  let input = args.length ? ('i' in routes[route] ? routes[route].i.assert(args[0]) : null) : null;

  const urlParams = path.match(/:[^/]+/g)?.map(p => p.slice(1)) ?? [];

  try {
    const res = await fetch(`/${templatedPath}`, { method });
    if (!res.ok) {
      return err(res.statusText);
    }
    const jason = await res.text();
    let superJason: unknown;

    try {
      superJason = parse(jason);
    } catch (e) {
      void e;
      return err('API response is not valid (Super)JSON');
    }

    const out = routes[route].o(superJason);

    if (out instanceof type.errors) {
      return err(out.summary);
    }

    return ok(out);
  } catch (e) {
    if (e instanceof TypeError) {
      return err('Network error');
    }
    return err('Unknown error');
  }
}
