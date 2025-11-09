import { z } from 'zod';

// QUERIES

// -- RTSP DATA

export const QUERY_RTSP_DATA = 'cctv:rtsp-data';

export const sRtspDataArgs = z.object({});

export const sRtspDataResponse = z.object({
  cameraName: z.string(),
  username: z.string(),
  password: z.string(),
  streams: z.array(
    z.object({
      streamId: z.string(),
      displayName: z.string(),
      resolution: z.string().nullable(),
      rtspUrl: z.string(),
    }),
  ),
});

export type RtspDataArgs = z.infer<typeof sRtspDataArgs>;
export type RtspDataResponse = z.infer<typeof sRtspDataResponse>;

// Dictionary of request schemas by query type
export const cameraRequestSchemas = {
  [QUERY_RTSP_DATA]: sRtspDataArgs,
} as const;

// Dictionary of response schemas by query type
export const cameraResponseSchemas = {
  [QUERY_RTSP_DATA]: sRtspDataResponse,
} as const;

// TypeScript mapping types for requests and responses
export type CameraQueryRequestMap = {
  [QUERY_RTSP_DATA]: RtspDataArgs;
};

export type CameraQueryResponseMap = {
  [QUERY_RTSP_DATA]: RtspDataResponse;
};
