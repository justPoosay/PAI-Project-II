import { routes } from 'common';

export type Nullish<T> = T | null | undefined;

export type Conversation = Omit<(typeof routes.conversations.infer)[0], 'updated_at'> & {
  updated_at: Date;
};
