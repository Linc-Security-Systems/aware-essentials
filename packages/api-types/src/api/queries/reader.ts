import { z } from 'zod';

export const QUERY_CAPTURE = 'device:capture';
export const QUERY_VERIFY = 'device:verify';

export const sCaptureQueryArgs = z.object({
  type: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const sVerifyQueryArgs = z.object({
  type: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const sCaptureQueryResponse = z.record(z.string(), z.any());
export const sVerifyQueryResponse = z.record(z.string(), z.any());

export type CaptureQueryArgs = z.infer<typeof sCaptureQueryArgs>;
export type VerifyQueryArgs = z.infer<typeof sVerifyQueryArgs>;

export type CaptureQueryResponse = z.infer<typeof sCaptureQueryResponse>;
export type VerifyQueryResponse = z.infer<typeof sVerifyQueryResponse>;

export const readerRequestSchemas = {
  [QUERY_CAPTURE]: sCaptureQueryArgs,
  [QUERY_VERIFY]: sVerifyQueryArgs,
} as const;

// Dictionary of response schemas by query type
export const readerResponseSchemas = {
  [QUERY_CAPTURE]: sCaptureQueryResponse,
  [QUERY_VERIFY]: sVerifyQueryResponse,
} as const;

// TypeScript mapping types for requests and responses
export type ReaderQueryRequestMap = {
  [QUERY_CAPTURE]: CaptureQueryArgs;
  [QUERY_VERIFY]: VerifyQueryArgs;
};

export type ReaderQueryResponseMap = {
  [QUERY_CAPTURE]: CaptureQueryResponse;
  [QUERY_VERIFY]: VerifyQueryResponse;
};
