export interface Chat {
  id: string;
  name: string;
}

type Role = "user" | "assistant" | "tool" | "function" | "system"

export interface Message {
  id: number;
  content: string;
  createdAt: Date;
  role: Role;
}