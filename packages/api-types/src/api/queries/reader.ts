import { z } from 'zod';

export const QUERY_CAPTURE = 'device:capture';

export const sCaptureQueryArgs = z.object({
  type: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const sCaptureQueryResponse = z.record(z.string(), z.any());

export type CaptureQueryArgs = z.infer<typeof sCaptureQueryArgs>;

export type CaptureQueryResponse = z.infer<typeof sCaptureQueryResponse>;

export const readerRequestSchemas = {
  [QUERY_CAPTURE]: sCaptureQueryArgs,
} as const;

// Dictionary of response schemas by query type
export const readerResponseSchemas = {
  [QUERY_CAPTURE]: sCaptureQueryResponse,
} as const;

// TypeScript mapping types for requests and responses
export type ReaderQueryRequestMap = {
  [QUERY_CAPTURE]: CaptureQueryArgs;
};

export type ReaderQueryResponseMap = {
  [QUERY_CAPTURE]: CaptureQueryResponse;
};
