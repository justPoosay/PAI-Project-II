export type WebSocketMessage =
  | { type: "tmp" }

export type ClientBoundWebSocketMessage =
  | { type: "message", action: "create", id: number, content: string, role: "assistant" | "user" }
  | { type: "stream", target: "message", id: number, role: "start" | "end" }
  | { type: "stream", target: "message", id: number, role: "chunk", content: string }
  | WebSocketMessage

export type ServerBoundWebSocketMessage =
  | { type: "message", action: "create", content: string }
  | WebSocketMessage