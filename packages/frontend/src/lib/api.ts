import { type, type Type } from 'arktype';
import ObjectId from 'bson-objectid';
import { Chat, Effort, Message, Model } from 'common';
import { entries } from 'common/utils';
import { err, ok, type Result } from 'neverthrow';
import SuperJSON, { parse } from 'superjson';
import { isKey } from './utils';

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

const DBChatRepresentation = type.or(
  Chat.omit('id').and({
    _id: type.instanceOf(ObjectId),
    'pinned?': 'boolean | undefined',
    messages: Message.array()
  })
);

export const routes = {
  'DELETE /chat/:id': {
    i: type({ id: 'string' })
  },
  'PATCH /chat/:id': {
    i: type({
      id: 'string',
      'name?': 'string | null',
      'model?': Model,
      'reasoningEffort?': Effort,
      'pinned?': 'boolean'
    }),
    o: type.or('null', DBChatRepresentation)
  },
  'GET /chat/:id': {
    i: type({ id: 'string' }),
    o: type.or('null', DBChatRepresentation)
  },
  'GET /chat/': {
    o: DBChatRepresentation.pick('_id', 'name', 'pinned', 'updatedAt').array()
  },
  'POST /chat/': {
    o: DBChatRepresentation
  },
  'GET /stripe/create-checkout-session': {
    o: type({ url: 'string' })
  },
  'GET /stripe/create-portal-session': {
    o: type({ url: 'string' })
  },
  'GET /stripe/price': {
    o: type({
      id: 'string',
      unitAmount: 'number',
      currency: 'string',
      interval: "'day' | 'month' | 'week' | 'year' | undefined"
    })
  },
  'GET /stripe/limits': {
    o: type({
      messagesUsed: 'number',
      refresh: 'Date',
      tier: "'free' | 'pro'"
    })
  },
  'GET /model/available': {
    o: Model.array()
  }
} as const satisfies Record<RouteString, { i?: Type<unknown, object>; o?: Type<unknown, object> }>;

type Routes = typeof routes;
type InputOf<K extends keyof Routes> = Routes[K] extends { i: Type<infer I, object> } ? I : never;
type OutputOf<K extends keyof Routes> = Routes[K] extends { o: Type<infer O, object> } ? O : void;

export async function query<K extends keyof Routes>(
  route: K,
  ...args: InputOf<K> extends never ? [] : [input: InputOf<K>]
): Promise<Result<OutputOf<K>, string | number>> {
  const [method, path] = route.split(' ') as [Method, string];
  const input = args.length
    ? 'i' in routes[route]
      ? routes[route].i.assert(args[0])
      : null
    : null;

  const urlParams = path.match(/:[^/]+/g)?.map(p => p.slice(1)) ?? [];
  let templatedPath = path;
  urlParams.forEach(param => {
    if (input && isKey(param, input)) {
      templatedPath = templatedPath.replace(`:${param}`, encodeURIComponent(input[param]));
    } else {
      throw new Error(`Missing parameter: ${param}`);
    }
  });

  const queryParams = new URLSearchParams();
  for (const param of entries(input ?? {})) {
    if (urlParams.includes(param[0])) {
      continue;
    }

    queryParams.append(param[0], param[1]);
  }

  try {
    const res = await fetch(`/api${templatedPath}?${queryParams.toString()}`, { method });
    if (!res.ok) {
      console.error(`[${route}] ${res.status}`);
      return err(res.status);
    }
    const jason = await res.text();
    let superJason: unknown;

    try {
      superJason = parse(jason);
    } catch (e) {
      console.error(`[${route}] ${e}`);
      return err('API response is not valid (Super)JSON');
    }

    if (!('o' in routes[route])) {
      return ok(undefined as OutputOf<K>);
    }

    const out = routes[route].o(superJason);

    if (out instanceof type.errors) {
      console.error(`[${route}] ${out.summary}`);
      return err(out.summary);
    }

    return ok(out as OutputOf<K>);
  } catch (e) {
    if (e instanceof TypeError) {
      return err('Network error');
    }
    return err('Unknown error');
  }
}
