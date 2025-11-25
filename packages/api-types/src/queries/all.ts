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

export type EventCapsQueryArgs = z.infer<typeof sEventCapsQueryArgs>;

export const QUERY_EVENT_CAPS = 'device:event-caps';

export const sEventCapsQueryResponse = z.array(z.string());

export type EventCapsQueryResponse = z.infer<typeof sEventCapsQueryResponse>;

// Dictionary of request schemas by query type
export const requestSchemasByType = {
  ...nvrRecorderRequestSchemas,
  ...nvrExporterRequestSchemas,
  ...nvrAnalyticsRequestSchemas,
  ...cameraRequestSchemas,
  [QUERY_EVENT_CAPS]: sEventCapsQueryArgs,
} as const;

// Dictionary of response schemas by query type
export const responseSchemasByType = {
  ...nvrRecorderResponseSchemas,
  ...nvrExporterResponseSchemas,
  ...nvrAnalyticsResponseSchemas,
  ...cameraResponseSchemas,
  [QUERY_EVENT_CAPS]: sEventCapsQueryResponse,
} as const;

// TypeScript mapping types for requests and responses
export type QueryRequestMap = NvrAnalyticsQueryRequestMap &
  NvrRecorderQueryRequestMap &
  CameraQueryRequestMap &
  NvrExporterQueryRequestMap & {
    [QUERY_EVENT_CAPS]: EventCapsQueryArgs;
  };

export type QueryResponseMap = NvrAnalyticsQueryResponseMap &
  NvrRecorderQueryResponseMap &
  CameraQueryResponseMap &
  NvrExporterQueryResponseMap & {
    [QUERY_EVENT_CAPS]: EventCapsQueryResponse;
  };

// Helper types for type inference
export type QueryType = keyof QueryRequestMap;
export type RequestForQuery<T extends QueryType> = QueryRequestMap[T];
export type ResponseForQuery<T extends QueryType> = QueryResponseMap[T];
