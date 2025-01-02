import { z } from "zod";

export const LogLevelSchema = z.enum(["trace", "debug", "info", "warn", "error", "fatal"]);