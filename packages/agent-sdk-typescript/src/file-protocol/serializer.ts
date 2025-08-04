// serializer.ts
//--------------------------------------------------------------
// Binary serializer/deserializer for HTTP tunnel messages
// • Compact binary format for efficient WebSocket transmission
// • Handles both RequestMessage and ResponseMessage types
// • Variable-length encoding for strings and buffers
//--------------------------------------------------------------

import {
  HttpTunnelMessage,
  RequestMessage,
  ResponseMessage,
  isRequestMessage,
  isResponseMessage,
} from './types';

// Message type constants
const MESSAGE_TYPE_REQUEST = 0x01;
const MESSAGE_TYPE_RESPONSE = 0x02;

/**
 * Serializes an HTTP tunnel message to binary format
 *
 * Binary format:
 * - 1 byte: message type (0x01 = request, 0x02 = response)
 * - 4 bytes: requestId (uint32, little-endian)
 * - 2 bytes: from string length (uint16, little-endian)
 * - N bytes: from string (UTF-8)
 *
 * For RequestMessage:
 * - 2 bytes: path string length (uint16, little-endian)
 * - N bytes: path string (UTF-8)
 *
 * For ResponseMessage:
 * - 2 bytes: status code (uint16, little-endian)
 * - 2 bytes: contentType string length (uint16, little-endian)
 * - N bytes: contentType string (UTF-8)
 * - 1 byte: isLast flag (0x00 = false, 0x01 = true)
 * - 4 bytes: body length (uint32, little-endian)
 * - N bytes: body data
 */
export function serialize(message: HttpTunnelMessage): Buffer {
  const buffers: Buffer[] = [];

  if (isRequestMessage(message)) {
    // Message type
    buffers.push(Buffer.from([MESSAGE_TYPE_REQUEST]));

    // RequestId
    const requestIdBuffer = Buffer.allocUnsafe(4);
    requestIdBuffer.writeUInt32LE(message.requestId, 0);
    buffers.push(requestIdBuffer);

    // From string
    const fromBuffer = Buffer.from(message.from, 'utf8');
    const fromLengthBuffer = Buffer.allocUnsafe(2);
    fromLengthBuffer.writeUInt16LE(fromBuffer.length, 0);
    buffers.push(fromLengthBuffer);
    buffers.push(fromBuffer);

    // Path string
    const pathBuffer = Buffer.from(message.path, 'utf8');
    const pathLengthBuffer = Buffer.allocUnsafe(2);
    pathLengthBuffer.writeUInt16LE(pathBuffer.length, 0);
    buffers.push(pathLengthBuffer);
    buffers.push(pathBuffer);
  } else if (isResponseMessage(message)) {
    // Message type
    buffers.push(Buffer.from([MESSAGE_TYPE_RESPONSE]));

    // RequestId
    const requestIdBuffer = Buffer.allocUnsafe(4);
    requestIdBuffer.writeUInt32LE(message.requestId, 0);
    buffers.push(requestIdBuffer);

    // From string
    const fromBuffer = Buffer.from(message.from, 'utf8');
    const fromLengthBuffer = Buffer.allocUnsafe(2);
    fromLengthBuffer.writeUInt16LE(fromBuffer.length, 0);
    buffers.push(fromLengthBuffer);
    buffers.push(fromBuffer);

    // Status code
    const statusBuffer = Buffer.allocUnsafe(2);
    statusBuffer.writeUInt16LE(message.status, 0);
    buffers.push(statusBuffer);

    // ContentType string
    const contentTypeBuffer = Buffer.from(message.contentType, 'utf8');
    const contentTypeLengthBuffer = Buffer.allocUnsafe(2);
    contentTypeLengthBuffer.writeUInt16LE(contentTypeBuffer.length, 0);
    buffers.push(contentTypeLengthBuffer);
    buffers.push(contentTypeBuffer);

    // IsLast flag
    buffers.push(Buffer.from([message.isLast ? 0x01 : 0x00]));

    // Body data
    const bodyLengthBuffer = Buffer.allocUnsafe(4);
    bodyLengthBuffer.writeUInt32LE(message.body.length, 0);
    buffers.push(bodyLengthBuffer);
    buffers.push(message.body);
  } else {
    throw new Error('Unknown message type');
  }

  return Buffer.concat(buffers);
}

/**
 * Deserializes binary data back to an HTTP tunnel message
 */
export function deserialize(data: Buffer): HttpTunnelMessage {
  if (data.length < 1) {
    throw new Error('Invalid message: too short');
  }

  let offset = 0;

  // Read message type
  const messageType = data.readUInt8(offset);
  offset += 1;

  if (messageType === MESSAGE_TYPE_REQUEST) {
    return deserializeRequest(data, offset);
  } else if (messageType === MESSAGE_TYPE_RESPONSE) {
    return deserializeResponse(data, offset);
  } else {
    throw new Error(`Unknown message type: 0x${messageType.toString(16)}`);
  }
}

function deserializeRequest(data: Buffer, offset: number): RequestMessage {
  // Read requestId
  if (offset + 4 > data.length)
    throw new Error('Invalid request: missing requestId');
  const requestId = data.readUInt32LE(offset);
  offset += 4;

  // Read from string
  if (offset + 2 > data.length)
    throw new Error('Invalid request: missing from length');
  const fromLength = data.readUInt16LE(offset);
  offset += 2;

  if (offset + fromLength > data.length)
    throw new Error('Invalid request: missing from data');
  const from = data.subarray(offset, offset + fromLength).toString('utf8');
  offset += fromLength;

  // Read path string
  if (offset + 2 > data.length)
    throw new Error('Invalid request: missing path length');
  const pathLength = data.readUInt16LE(offset);
  offset += 2;

  if (offset + pathLength > data.length)
    throw new Error('Invalid request: missing path data');
  const path = data.subarray(offset, offset + pathLength).toString('utf8');

  return {
    from,
    requestId,
    path,
  };
}

function deserializeResponse(data: Buffer, offset: number): ResponseMessage {
  // Read requestId
  if (offset + 4 > data.length)
    throw new Error('Invalid response: missing requestId');
  const requestId = data.readUInt32LE(offset);
  offset += 4;

  // Read from string
  if (offset + 2 > data.length)
    throw new Error('Invalid response: missing from length');
  const fromLength = data.readUInt16LE(offset);
  offset += 2;

  if (offset + fromLength > data.length)
    throw new Error('Invalid response: missing from data');
  const from = data.subarray(offset, offset + fromLength).toString('utf8');
  offset += fromLength;

  // Read status code
  if (offset + 2 > data.length)
    throw new Error('Invalid response: missing status');
  const status = data.readUInt16LE(offset);
  offset += 2;

  // Read contentType string
  if (offset + 2 > data.length)
    throw new Error('Invalid response: missing contentType length');
  const contentTypeLength = data.readUInt16LE(offset);
  offset += 2;

  if (offset + contentTypeLength > data.length)
    throw new Error('Invalid response: missing contentType data');
  const contentType = data
    .subarray(offset, offset + contentTypeLength)
    .toString('utf8');
  offset += contentTypeLength;

  // Read isLast flag
  if (offset + 1 > data.length)
    throw new Error('Invalid response: missing isLast flag');
  const isLast = data.readUInt8(offset) === 0x01;
  offset += 1;

  // Read body data
  if (offset + 4 > data.length)
    throw new Error('Invalid response: missing body length');
  const bodyLength = data.readUInt32LE(offset);
  offset += 4;

  if (offset + bodyLength > data.length)
    throw new Error('Invalid response: missing body data');
  const body = data.subarray(offset, offset + bodyLength);

  return {
    from,
    requestId,
    status,
    contentType,
    body,
    isLast,
  };
}
