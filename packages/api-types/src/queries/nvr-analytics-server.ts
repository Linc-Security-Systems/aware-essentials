import { z } from 'zod';
import { sFileResponse } from '../primitives';
import { sSortOptions } from '../api';

// QUERIES

// -- Media Search

export const QUERY_MEDIA_SEARCH = 'cctv:media-search';

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

export type MediaSearchArgs = z.infer<typeof sMediaSearchArgs>;
export type MediaSearchMatch = z.infer<typeof sMediaSearchMatch>;
export type MediaSearchResponse = z.infer<typeof sMediaSearchResponse>;

// -- Scene Preview Clip

export const QUERY_SCENE_PREVIEW_CLIP = 'cctv:scene-preview-clip';

export const sScenePreviewClipArgs = z.object({
  providerAssignedRef: z.string(),
});

export const sScenePreviewClipResponse = sFileResponse;

export type ScenePreviewClipArgs = z.infer<typeof sScenePreviewClipArgs>;

export type ScenePreviewClipResponse = z.infer<
  typeof sScenePreviewClipResponse
>;

// -- Object Snapshot

export const QUERY_OBJECT_SNAPSHOT = 'cctv:object-snapshot';

export const sObjectSnapshotArgs = z.object({
  providerAssignedRef: z.string(),
  height: z.number().optional(),
  quality: z.number().optional(),
  crop: z.boolean(),
  boxes: z.boolean(),
});

export const sObjectSnapshotResponse = sFileResponse;

export type ObjectSnapshotArgs = z.infer<typeof sObjectSnapshotArgs>;

export type ObjectSnapshotResponse = z.infer<typeof sObjectSnapshotResponse>;

// -- Object Thumbnail

export const QUERY_OBJECT_THUMBNAIL = 'cctv:object-thumbnail';

export const sObjectThumbnailArgs = z.object({
  providerAssignedRef: z.string(),
});

export const sObjectThumbnailResponse = sFileResponse;

export type ObjectThumbnailArgs = z.infer<typeof sObjectThumbnailArgs>;

export type ObjectThumbnailResponse = z.infer<typeof sObjectThumbnailResponse>;

// Dictionary of request schemas by query type
export const nvrAnalyticsRequestSchemas = {
  [QUERY_MEDIA_SEARCH]: sMediaSearchArgs,
  [QUERY_SCENE_PREVIEW_CLIP]: sScenePreviewClipArgs,
  [QUERY_OBJECT_SNAPSHOT]: sObjectSnapshotArgs,
  [QUERY_OBJECT_THUMBNAIL]: sObjectThumbnailArgs,
} as const;

// Dictionary of response schemas by query type
export const nvrAnalyticsResponseSchemas = {
  [QUERY_MEDIA_SEARCH]: sMediaSearchResponse,
  [QUERY_SCENE_PREVIEW_CLIP]: sScenePreviewClipResponse,
  [QUERY_OBJECT_SNAPSHOT]: sObjectSnapshotResponse,
  [QUERY_OBJECT_THUMBNAIL]: sObjectThumbnailResponse,
} as const;

// TypeScript mapping types for requests and responses
export type NvrAnalyticsQueryRequestMap = {
  [QUERY_MEDIA_SEARCH]: MediaSearchArgs;
  [QUERY_SCENE_PREVIEW_CLIP]: ScenePreviewClipArgs;
  [QUERY_OBJECT_SNAPSHOT]: ObjectSnapshotArgs;
  [QUERY_OBJECT_THUMBNAIL]: ObjectThumbnailArgs;
};

export type NvrAnalyticsQueryResponseMap = {
  [QUERY_MEDIA_SEARCH]: MediaSearchResponse;
  [QUERY_SCENE_PREVIEW_CLIP]: ScenePreviewClipResponse;
  [QUERY_OBJECT_SNAPSHOT]: ObjectSnapshotResponse;
  [QUERY_OBJECT_THUMBNAIL]: ObjectThumbnailResponse;
};
