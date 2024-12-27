// before logging a message, check if the log level is less than the level of the message
export const logLevel = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
} as const;