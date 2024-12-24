export type WebSocketMessage =
  | { role: "finish" }

/** @description message sent from the server to the client */
export type ClientBoundWebSocketMessage =
  | { role: "chunk", type: "tool-call", toolCallId: string, toolName: string, args: Record<string, unknown> }
  |
  {
    role: "chunk",
    type: "tool-result",
    toolCallId: string,
    toolName: string,
    args: Record<string, unknown>,
    result: unknown
  }
  | { role: "chunk", type: "text-delta", textDelta: string }
  | WebSocketMessage

/** @description message sent from the client to the server */
export type ServerBoundWebSocketMessage =
  | { role: "message", action: "create", content: string }
  | { role: "action", action: "abort" }
  | WebSocketMessage