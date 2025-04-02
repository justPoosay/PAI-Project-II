import { color, type ColorInput } from 'bun';
import dayjs from 'dayjs';
import { LogLevel } from './schemas';
import { env } from './utils';

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
} satisfies Record<typeof LogLevel.infer, [number, ColorInput]>);

const logger = Object.fromEntries(
  (['trace', 'debug', 'info', 'warn', 'error', 'fatal'] satisfies (typeof LogLevel.infer)[]).map(
    level => [
      level,
      (...args: unknown[]) => {
        const [index, color] = logLevel[level];
        if (index < logLevel[env.LOG_LEVEL][0]) return;
        const date = dayjs().format('MM-DD-YY HH:mm:ss.SSS');
        console.log(colorize(color, `[${date}] [${level.toUpperCase()}]:`), ...args);
      }
    ]
  )
) as Record<typeof LogLevel.infer, (...args: unknown[]) => void>;

export default logger;
