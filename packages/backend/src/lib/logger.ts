import { color, type ColorInput } from 'bun';
import dayjs from 'dayjs';
import { env } from './env';
import type { LogLevel } from './schemas';

function colorize(input: ColorInput, text: string) {
  return color(input, 'ansi') + text + color('white', 'ansi');
}

const logLevel = Object.freeze({
  trace: [-1, 'blue'],
  debug: [0, 'cyan'],
  info: [1, 'lime'],
  warn: [2, 'yellow'],
  error: [3, 'red'],
  fatal: [4, 'magenta']
} satisfies Record<LogLevel, [number, ColorInput]>);

export const logger = Object.fromEntries(
  (['trace', 'debug', 'info', 'warn', 'error', 'fatal'] satisfies LogLevel[]).map(level => [
    level,
    (...args: unknown[]) => {
      const [index, color] = logLevel[level];
      if (index < logLevel[env.LOG_LEVEL][0]) return;
      const date = dayjs().format('MM-DD-YY HH:mm:ss.SSS');
      console.log(colorize(color, `[${date}] [${level.toUpperCase()}]:`), ...args);
    }
  ])
) as Record<LogLevel, (...args: unknown[]) => void>;
