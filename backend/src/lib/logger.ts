import { color, type ColorInput } from "bun";
import { z } from "zod";
import dayjs from "dayjs";
import { env } from "~/lib/utils";
import { LogLevelSchema } from "~/lib/schemas";

function colorize(input: ColorInput, text: string) {
  return color(input, "ansi") + text + color("white", "ansi");
}

type LogLevel = z.infer<typeof LogLevelSchema>;

const logLevel = {
  trace: [-1, "blue"],
  debug: [0, "cyan"],
  info: [1, "lime"],
  warn: [2, "yellow"],
  error: [3, "red"],
  fatal: [4, "magenta"],
} as const satisfies Record<LogLevel, [number, ColorInput]>;

const logger = Object.fromEntries(
  LogLevelSchema.options.map((level) => [
    level,
    (...args: any[]) => {
      const [index, color] = logLevel[level];
      if (index < logLevel[env.LOG_LEVEL][0]) return;
      const date = dayjs().format("MM-DD-YY HH:mm:ss.SSS");
      console.log(colorize(color, `[${date}] [${level.toUpperCase()}]:`), ...args);
    },
  ])
) as Record<LogLevel, (...args: any[]) => void>;

export default logger;
