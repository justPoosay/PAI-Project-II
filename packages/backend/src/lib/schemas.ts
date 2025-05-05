import { type } from 'arktype';

export const LogLevel = type("'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'");
export type LogLevel = typeof LogLevel.infer;
