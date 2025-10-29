import {
  CameraQueryRequestMap,
  CameraQueryResponseMap,
  cameraRequestSchemas,
  cameraResponseSchemas,
  NvrExporterQueryRequestMap,
  NvrExporterQueryResponseMap,
  nvrExporterRequestSchemas,
  nvrExporterResponseSchemas,
  NvrRecorderQueryRequestMap,
  NvrRecorderQueryResponseMap,
  nvrRecorderRequestSchemas,
  nvrRecorderResponseSchemas,
} from '../device';
import {
  NvrAnalyticsQueryRequestMap,
  NvrAnalyticsQueryResponseMap,
  nvrAnalyticsRequestSchemas,
  nvrAnalyticsResponseSchemas,
} from '../device/nvr-analytics-server';

// Dictionary of request schemas by query type
export const requestSchemasByType = {
  ...nvrRecorderRequestSchemas,
  ...nvrExporterRequestSchemas,
  ...nvrAnalyticsRequestSchemas,
  ...cameraRequestSchemas,
} as const;

// Dictionary of response schemas by query type
export const responseSchemasByType = {
  ...nvrRecorderResponseSchemas,
  ...nvrExporterResponseSchemas,
  ...nvrAnalyticsResponseSchemas,
  ...cameraResponseSchemas,
} as const;

// TypeScript mapping types for requests and responses
export type QueryRequestMap = NvrAnalyticsQueryRequestMap &
  NvrRecorderQueryRequestMap &
  CameraQueryRequestMap &
  NvrExporterQueryRequestMap;

export type QueryResponseMap = NvrAnalyticsQueryResponseMap &
  NvrRecorderQueryResponseMap &
  CameraQueryResponseMap &
  NvrExporterQueryResponseMap;

// Helper types for type inference
export type QueryType = keyof QueryRequestMap;
export type RequestForQuery<T extends QueryType> = QueryRequestMap[T];
export type ResponseForQuery<T extends QueryType> = QueryResponseMap[T];
