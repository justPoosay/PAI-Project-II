export interface Chat {
  id: string;
  name: string;
}

type Role = "user" | "assistant"

export interface Message {
  id: number;
  content: string;
  createdAt: Date;
  role: Role;
}