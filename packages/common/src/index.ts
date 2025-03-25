import { z } from 'zod';
import { MessageSchema, ModelSchema } from './schemas';

export * from './models';
export * from './schemas';

export type Message = z.infer<typeof MessageSchema>;
export type Model = z.infer<typeof ModelSchema>;
