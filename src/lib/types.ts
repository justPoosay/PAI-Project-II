import { z } from "zod";
import { routes } from "../../shared/schemas.ts";

export type Conversation = Omit<z.infer<typeof routes["conversations"]>[0], "updated_at"> & { updated_at: Date };