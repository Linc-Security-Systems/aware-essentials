import { sDeviceDiscoveryDto } from '../device-import';
import { sRecordingSequence, sSortOptions } from '../api';
import { z } from 'zod';

// CORE
export const QUERY_DEVICE_GRAPH = 'core:device-graph';

// CCTV
export const QUERY_RECORDINGS_BY_TIME_RANGE = 'cctv:recordings-by-time-range';
export const QUERY_MEDIA_SEARCH = 'cctv:media-search';
export const QUERY_RTSP_DATA = 'cctv:rtsp-data';
export const QUERY_PREVIEW_IMAGE = 'cctv:preview-image';
export const QUERY_CAMERA_LATEST_FRAME = 'cctv:latest-frame';
export const QUERY_SCENE_PREVIEW_CLIP = 'cctv:scene-preview-clip';
export const QUERY_OBJECT_SNAPSHOT = 'cctv:object-snapshot';
export const QUERY_OBJECT_THUMBNAIL = 'cctv:object-thumbnail';

// Zod schemas for request args

export const sRecordingsByTimeRangeArgs = z.object({
  timeFrom: z.number(),
  timeTo: z.number(),
});

export const sMediaSearchArgs = z
  .object({
    devices: z.array(z.any()).optional(),
    limit: z.number().nonnegative(),
    q: z.string(),
    similarTo: z.string().optional(),
    label: z.array(z.string().nonempty()),
    timeFrom: z.number().nonnegative(),
    timeTo: z.number().nonnegative(),
    sortBy: sSortOptions,
  })
  .partial();

export const sRtspDataArgs = z.object({});

export const sPreviewImageArgs = z.object({
  time: z.number(),
  height: z.number(),
});

export const sCameraLatestFrameArgs = z.object({
  width: z.number(),
  height: z.number(),
});

export const sScenePreviewClipArgs = z.object({
  providerAssignedRef: z.string(),
});

export const sObjectSnapshotArgs = z.object({
  providerAssignedRef: z.string(),
  height: z.number().optional(),
  quality: z.number().optional(),
  crop: z.boolean(),
  boxes: z.boolean(),
});

export const sObjectThumbnailArgs = z.object({
  providerAssignedRef: z.string(),
});

// Zod schemas for responses
export const sDeviceGraphResponse = sDeviceDiscoveryDto;

export const sRecordingsResponse = z.array(sRecordingSequence);

export const sMediaSearchMatch = z.object({
  relevance: z.number(),
  providerAssignedRef: z.string(),
  foreignRef: z.string(),
  provider: z.string(),
  probability: z.number(),
  objectKind: z.string(),
  startTime: z.number(),
  endTime: z.number().nullable(),
});

export const sMediaSearchResponse = z.array(sMediaSearchMatch);

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

// File download responses
export const sFileResponse = z
  .object({
    mimeType: z.string().nonempty(),
    data: z.string().nonempty(),
  })
  .nullable();

export const sPreviewImageResponse = sFileResponse;
export const sCameraLatestFrameResponse = sFileResponse;
export const sScenePreviewClipResponse = sFileResponse;
export const sObjectSnapshotResponse = sFileResponse;
export const sObjectThumbnailResponse = sFileResponse;

// TypeScript types derived from Zod schemas
export type DeviceGraphResponse = z.infer<typeof sDeviceGraphResponse>;
export type RecordingsByTimeRangeArgs = z.infer<
  typeof sRecordingsByTimeRangeArgs
>;
export type MediaSearchArgs = z.infer<typeof sMediaSearchArgs>;
export type RtspDataArgs = z.infer<typeof sRtspDataArgs>;
export type PreviewImageArgs = z.infer<typeof sPreviewImageArgs>;
export type CameraLatestFrameArgs = z.infer<typeof sCameraLatestFrameArgs>;
export type ScenePreviewClipArgs = z.infer<typeof sScenePreviewClipArgs>;
export type ObjectSnapshotArgs = z.infer<typeof sObjectSnapshotArgs>;
export type ObjectThumbnailArgs = z.infer<typeof sObjectThumbnailArgs>;

export type RecordingsResponse = z.infer<typeof sRecordingsResponse>;
export type MediaSearchMatch = z.infer<typeof sMediaSearchMatch>;
export type MediaSearchResponse = z.infer<typeof sMediaSearchResponse>;
export type RtspDataResponse = z.infer<typeof sRtspDataResponse>;
export type PreviewImageResponse = z.infer<typeof sPreviewImageResponse>;
export type CameraLatestFrameResponse = z.infer<
  typeof sCameraLatestFrameResponse
>;
export type ScenePreviewClipResponse = z.infer<
  typeof sScenePreviewClipResponse
>;
export type ObjectSnapshotResponse = z.infer<typeof sObjectSnapshotResponse>;
export type ObjectThumbnailResponse = z.infer<typeof sObjectThumbnailResponse>;

// Dictionary of request schemas by query type
export const requestSchemasByType = {
  [QUERY_DEVICE_GRAPH]: z.object({}),
  [QUERY_RECORDINGS_BY_TIME_RANGE]: sRecordingsByTimeRangeArgs,
  [QUERY_MEDIA_SEARCH]: sMediaSearchArgs,
  [QUERY_RTSP_DATA]: sRtspDataArgs,
  [QUERY_PREVIEW_IMAGE]: sPreviewImageArgs,
  [QUERY_CAMERA_LATEST_FRAME]: sCameraLatestFrameArgs,
  [QUERY_SCENE_PREVIEW_CLIP]: sScenePreviewClipArgs,
  [QUERY_OBJECT_SNAPSHOT]: sObjectSnapshotArgs,
  [QUERY_OBJECT_THUMBNAIL]: sObjectThumbnailArgs,
} as const;

// Dictionary of response schemas by query type
export const responseSchemasByType = {
  [QUERY_DEVICE_GRAPH]: sDeviceGraphResponse,
  [QUERY_RECORDINGS_BY_TIME_RANGE]: sRecordingsResponse,
  [QUERY_MEDIA_SEARCH]: sMediaSearchResponse,
  [QUERY_RTSP_DATA]: sRtspDataResponse,
  [QUERY_PREVIEW_IMAGE]: sPreviewImageResponse,
  [QUERY_CAMERA_LATEST_FRAME]: sCameraLatestFrameResponse,
  [QUERY_SCENE_PREVIEW_CLIP]: sScenePreviewClipResponse,
  [QUERY_OBJECT_SNAPSHOT]: sObjectSnapshotResponse,
  [QUERY_OBJECT_THUMBNAIL]: sObjectThumbnailResponse,
} as const;

// TypeScript mapping types for requests and responses
export type QueryRequestMap = {
  [QUERY_DEVICE_GRAPH]: null;
  [QUERY_RECORDINGS_BY_TIME_RANGE]: RecordingsByTimeRangeArgs;
  [QUERY_MEDIA_SEARCH]: MediaSearchArgs;
  [QUERY_RTSP_DATA]: RtspDataArgs;
  [QUERY_PREVIEW_IMAGE]: PreviewImageArgs;
  [QUERY_CAMERA_LATEST_FRAME]: CameraLatestFrameArgs;
  [QUERY_SCENE_PREVIEW_CLIP]: ScenePreviewClipArgs;
  [QUERY_OBJECT_SNAPSHOT]: ObjectSnapshotArgs;
  [QUERY_OBJECT_THUMBNAIL]: ObjectThumbnailArgs;
};

export type QueryResponseMap = {
  [QUERY_DEVICE_GRAPH]: DeviceGraphResponse;
  [QUERY_RECORDINGS_BY_TIME_RANGE]: RecordingsResponse;
  [QUERY_MEDIA_SEARCH]: MediaSearchResponse;
  [QUERY_RTSP_DATA]: RtspDataResponse;
  [QUERY_PREVIEW_IMAGE]: PreviewImageResponse;
  [QUERY_CAMERA_LATEST_FRAME]: CameraLatestFrameResponse;
  [QUERY_SCENE_PREVIEW_CLIP]: ScenePreviewClipResponse;
  [QUERY_OBJECT_SNAPSHOT]: ObjectSnapshotResponse;
  [QUERY_OBJECT_THUMBNAIL]: ObjectThumbnailResponse;
};

// Helper types for type inference
export type QueryType = keyof QueryRequestMap;
export type RequestForQuery<T extends QueryType> = QueryRequestMap[T];
export type ResponseForQuery<T extends QueryType> = QueryResponseMap[T];
