// serializer.test.ts
//--------------------------------------------------------------
// Tests for HTTP tunnel message serialization/deserialization
// • Round-trip tests to ensure data integrity
// • Tests both RequestMessage and ResponseMessage types
// • Validates binary format compatibility
//--------------------------------------------------------------

import { serialize, deserialize } from './serializer';
import { RequestMessage, ResponseMessage } from './types';

describe('HTTP Tunnel Serializer', () => {
  describe('RequestMessage serialization', () => {
    it('should serialize and deserialize a simple request message', () => {
      const original: RequestMessage = {
        from: 'backend',
        requestId: 12345,
        path: '/files/image.jpg',
      };

      const serialized = serialize(original);
      const deserialized = deserialize(serialized) as RequestMessage;

      expect(deserialized).toEqual(original);
    });

    it('should handle request with empty path', () => {
      const original: RequestMessage = {
        from: 'test-client',
        requestId: 0,
        path: '',
      };

      const serialized = serialize(original);
      const deserialized = deserialize(serialized) as RequestMessage;

      expect(deserialized).toEqual(original);
    });

    it('should handle request with special characters in path', () => {
      const original: RequestMessage = {
        from: 'backend',
        requestId: 999,
        path: '/files/测试文件.jpg',
      };

      const serialized = serialize(original);
      const deserialized = deserialize(serialized) as RequestMessage;

      expect(deserialized).toEqual(original);
    });

    it('should handle large request ID', () => {
      const original: RequestMessage = {
        from: 'system',
        requestId: 4294967295, // Max uint32
        path: '/large-id-test',
      };

      const serialized = serialize(original);
      const deserialized = deserialize(serialized) as RequestMessage;

      expect(deserialized).toEqual(original);
    });
  });

  describe('ResponseMessage serialization', () => {
    it('should serialize and deserialize a simple response message', () => {
      const original: ResponseMessage = {
        from: 'agent',
        requestId: 12345,
        status: 200,
        contentType: 'image/jpeg',
        body: Buffer.from('fake image data'),
        isLast: true,
      };

      const serialized = serialize(original);
      const deserialized = deserialize(serialized) as ResponseMessage;

      expect(deserialized).toEqual(original);
    });

    it('should handle response with empty body', () => {
      const original: ResponseMessage = {
        from: 'agent',
        requestId: 404,
        status: 404,
        contentType: 'text/plain',
        body: Buffer.alloc(0),
        isLast: true,
      };

      const serialized = serialize(original);
      const deserialized = deserialize(serialized) as ResponseMessage;

      expect(deserialized).toEqual(original);
    });

    it('should handle response with large binary body', () => {
      const largeBuffer = Buffer.alloc(65536, 0xab); // 64KB of test data
      const original: ResponseMessage = {
        from: 'file-server',
        requestId: 7777,
        status: 200,
        contentType: 'application/octet-stream',
        body: largeBuffer,
        isLast: false,
      };

      const serialized = serialize(original);
      const deserialized = deserialize(serialized) as ResponseMessage;

      expect(deserialized).toEqual(original);
    });

    it('should handle response with unicode content type', () => {
      const original: ResponseMessage = {
        from: 'agent',
        requestId: 888,
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: Buffer.from('<!DOCTYPE html><html>测试</html>', 'utf8'),
        isLast: true,
      };

      const serialized = serialize(original);
      const deserialized = deserialize(serialized) as ResponseMessage;

      expect(deserialized).toEqual(original);
    });

    it('should handle different status codes', () => {
      const statusCodes = [200, 404, 403, 500, 301];

      statusCodes.forEach((status) => {
        const original: ResponseMessage = {
          from: 'agent',
          requestId: status,
          status,
          contentType: 'text/plain',
          body: Buffer.from(`Status: ${status}`),
          isLast: true,
        };

        const serialized = serialize(original);
        const deserialized = deserialize(serialized) as ResponseMessage;

        expect(deserialized).toEqual(original);
      });
    });

    it('should preserve isLast flag correctly', () => {
      const testCases = [true, false];

      testCases.forEach((isLast) => {
        const original: ResponseMessage = {
          from: 'agent',
          requestId: 123,
          status: 200,
          contentType: 'text/plain',
          body: Buffer.from('test'),
          isLast,
        };

        const serialized = serialize(original);
        const deserialized = deserialize(serialized) as ResponseMessage;

        expect(deserialized.isLast).toBe(isLast);
        expect(deserialized).toEqual(original);
      });
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid message type', () => {
      const invalidBuffer = Buffer.from([0xff, 0x00, 0x00, 0x00, 0x00]);
      expect(() => deserialize(invalidBuffer)).toThrow('Unknown message type');
    });

    it('should throw error for truncated message', () => {
      const tooShort = Buffer.from([0x01]); // Only message type, missing data
      expect(() => deserialize(tooShort)).toThrow();
    });

    it('should throw error for empty buffer', () => {
      const empty = Buffer.alloc(0);
      expect(() => deserialize(empty)).toThrow('Invalid message: too short');
    });
  });

  describe('Binary format validation', () => {
    it('should produce deterministic output for same input', () => {
      const message: RequestMessage = {
        from: 'test',
        requestId: 42,
        path: '/test',
      };

      const serialized1 = serialize(message);
      const serialized2 = serialize(message);

      expect(serialized1.equals(serialized2)).toBe(true);
    });

    it('should have correct message type bytes', () => {
      const request: RequestMessage = {
        from: 'test',
        requestId: 1,
        path: '/test',
      };

      const response: ResponseMessage = {
        from: 'test',
        requestId: 1,
        status: 200,
        contentType: 'text/plain',
        body: Buffer.from('test'),
        isLast: true,
      };

      const serializedRequest = serialize(request);
      const serializedResponse = serialize(response);

      expect(serializedRequest[0]).toBe(0x01); // REQUEST type
      expect(serializedResponse[0]).toBe(0x02); // RESPONSE type
    });
  });
});
