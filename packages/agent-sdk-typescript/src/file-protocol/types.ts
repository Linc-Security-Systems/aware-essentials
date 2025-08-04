// types.ts
//--------------------------------------------------------------
// Binary protocol message types for HTTP tunnel over WebSocket
// • Dead-simple minimal HTTP GET only server
// • No request headers, response only has content-type + body
// • Request ID for correlation and chunked responses
//--------------------------------------------------------------

/**
 * Base metadata for all HTTP tunnel messages
 */
export interface MessageMetadata {
  /** Source identifier (e.g., 'agent', 'backend') */
  from: string;
  /** Unique request identifier for correlation */
  requestId: number;
}

/**
 * HTTP GET request message
 */
export interface RequestMessage extends MessageMetadata {
  path: string;
}

/**
 * HTTP response message (can be chunked)
 */
export interface ResponseMessage extends MessageMetadata {
  /** HTTP status code */
  status: number;
  /** Response content type (e.g., 'image/jpeg', 'text/plain') */
  contentType: string;
  /** Response body chunk (raw binary data) */
  body: Buffer;
  /** Whether this is the last chunk of the response */
  isLast: boolean;
}

/**
 * Union type for all HTTP tunnel messages
 */
export type HttpTunnelMessage = RequestMessage | ResponseMessage;

/**
 * Type guards for message discrimination
 */
export function isRequestMessage(
  msg: HttpTunnelMessage,
): msg is RequestMessage {
  return 'method' in msg && 'path' in msg;
}

export function isResponseMessage(
  msg: HttpTunnelMessage,
): msg is ResponseMessage {
  return (
    'status' in msg && 'contentType' in msg && 'body' in msg && 'isLast' in msg
  );
}
