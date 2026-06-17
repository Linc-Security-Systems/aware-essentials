import { z } from 'zod';
import {
  cameraRequestSchemas,
  cameraResponseSchemas,
  CameraQueryRequestMap,
  CameraQueryResponseMap,
} from './camera';
import {
  nvrAnalyticsRequestSchemas,
  nvrAnalyticsResponseSchemas,
  NvrAnalyticsQueryRequestMap,
  NvrAnalyticsQueryResponseMap,
} from './nvr-analytics-server';
import {
  nvrExporterRequestSchemas,
  nvrExporterResponseSchemas,
  NvrExporterQueryRequestMap,
  NvrExporterQueryResponseMap,
} from './nvr-exporter';
import {
  nvrRecorderRequestSchemas,
  nvrRecorderResponseSchemas,
  NvrRecorderQueryRequestMap,
  NvrRecorderQueryResponseMap,
} from './nvr-recorder';

// queries that apply to all devices
export const sEventCapsQueryArgs = z.object({});

export const sCaptureQueryArgs = z.object({
  type: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type EventCapsQueryArgs = z.infer<typeof sEventCapsQueryArgs>;

export type CaptureQueryArgs = z.infer<typeof sCaptureQueryArgs>;

export const QUERY_EVENT_CAPS = 'device:event-caps';

export const QUERY_CAPTURE = 'device:capture';

export const sEventCapsQueryResponse = z.array(z.string());

export const sCaptureQueryResponse = z.record(z.string(), z.any());

export type EventCapsQueryResponse = z.infer<typeof sEventCapsQueryResponse>;
export type CaptureQueryResponse = z.infer<typeof sCaptureQueryResponse>;

// Dictionary of request schemas by query type
export const requestSchemasByType = {
  ...nvrRecorderRequestSchemas,
  ...nvrExporterRequestSchemas,
  ...nvrAnalyticsRequestSchemas,
  ...cameraRequestSchemas,
  [QUERY_EVENT_CAPS]: sEventCapsQueryArgs,
  [QUERY_CAPTURE]: sCaptureQueryArgs,
} as const;

// Dictionary of response schemas by query type
export const responseSchemasByType = {
  ...nvrRecorderResponseSchemas,
  ...nvrExporterResponseSchemas,
  ...nvrAnalyticsResponseSchemas,
  ...cameraResponseSchemas,
  [QUERY_EVENT_CAPS]: sEventCapsQueryResponse,
  [QUERY_CAPTURE]: sCaptureQueryResponse,
} as const;

// TypeScript mapping types for requests and responses
export type QueryRequestMap = NvrAnalyticsQueryRequestMap &
  NvrRecorderQueryRequestMap &
  CameraQueryRequestMap &
  NvrExporterQueryRequestMap & {
    [QUERY_EVENT_CAPS]: EventCapsQueryArgs;
    [QUERY_CAPTURE]: CaptureQueryArgs;
  };

export type QueryResponseMap = NvrAnalyticsQueryResponseMap &
  NvrRecorderQueryResponseMap &
  CameraQueryResponseMap &
  NvrExporterQueryResponseMap & {
    [QUERY_EVENT_CAPS]: EventCapsQueryResponse;
    [QUERY_CAPTURE]: CaptureQueryResponse;
  };

// Helper types for type inference
export type QueryType = keyof QueryRequestMap;
export type RequestForQuery<T extends QueryType> = QueryRequestMap[T];
export type ResponseForQuery<T extends QueryType> = QueryResponseMap[T];
