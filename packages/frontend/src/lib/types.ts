import { z } from 'zod';
import { routes } from 'shared';

export type Nullish<T> = T | null | undefined;

export type Conversation = Omit<z.infer<(typeof routes)['conversations']>[0], 'updated_at'> & {
  updated_at: Date;
};
