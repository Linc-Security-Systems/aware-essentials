export const WS_SERVER_READY = 'server-ready';
export const WS_KEEP_ALIVE = 'keep-alive';

export type WebSocketClientId = number;

export interface WebSocketMessage {
  readonly event: string;
  readonly data: unknown;
}
