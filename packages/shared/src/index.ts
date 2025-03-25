import { z } from 'zod';
import { ModelSchema, MessageSchema } from './schemas';

export * from './schemas';
export * from './constants';

/** @description conversation message as held by the client */
export type Message = z.infer<typeof MessageSchema>;

export type Model = z.infer<typeof ModelSchema>;
