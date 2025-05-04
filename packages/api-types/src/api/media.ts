import { z } from 'zod';
import { sPaginatedQueryResponseOf } from './query';

export const sRecordingSequence = z.object({
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
  motion: z.number().optional(),
  objects: z.number().optional(),
});

export const sGetRecordingsRequest = z.object({
  deviceId: z.string().nonempty(),
  timeFrom: z.number().nonnegative(),
  timeTo: z.number().nonnegative(),
});

export const sGetRecordingsResponse =
  sPaginatedQueryResponseOf(sRecordingSequence);

export const sGetPreviewImageRequest = z.object({
  deviceId: z.string().nonempty(),
  time: z.number().nonnegative(),
  height: z.number().nonnegative(),
});

export const sGetScenePreviewClipRequest = z.object({
  deviceId: z.string().nonempty(),
  providerAssignedRef: z.string().nonempty(),
});

export const sGetObjectSnapshotRequest = z.object({
  deviceId: z.string().nonempty(),
  providerAssignedRef: z.string().nonempty(),
  crop: z.boolean(),
  boxes: z.boolean(),
  height: z.number().nonnegative().optional(),
  quality: z.number().nonnegative().optional(),
});

export const sGetObjectThumbnailRequest = z.object({
  deviceId: z.string().nonempty(),
  providerAssignedRef: z.string().nonempty(),
});

export const sGetExportLinkResponse = z.object({
  relativeUrl: z.string().nonempty(),
});

const sSortOptions = z.union([z.literal('time_asc'), z.literal('time_desc')]);

export const sMediaSearchQueryDto = z
  .object({
    limit: z.number().nonnegative(),
    q: z.string(),
    deviceId: z.array(z.string().nonempty()),
    similarTo: z.string().optional(),
    label: z.array(z.string().nonempty()),
    timeFrom: z.number().nonnegative(),
    timeTo: z.number().nonnegative(),
    sortBy: sSortOptions,
  })
  .partial();

export const sGetLatestFrameRequest = z.object({
  deviceId: z.string().nonempty(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
});

export type RecordingSequence = z.infer<typeof sRecordingSequence>;

export type GetRecordingsRequest = z.infer<typeof sGetRecordingsRequest>;

export type GetRecordingsResponse = z.infer<typeof sGetRecordingsResponse>;

export type GetPreviewImageRequest = z.infer<typeof sGetPreviewImageRequest>;

export type GetScenePreviewClipRequest = z.infer<
  typeof sGetScenePreviewClipRequest
>;

export type GetObjectSnapshotRequest = z.infer<
  typeof sGetObjectSnapshotRequest
>;

export type GetObjectThumbnailRequest = z.infer<
  typeof sGetObjectThumbnailRequest
>;

export type GetExportLinkResponse = z.infer<typeof sGetExportLinkResponse>;

export type MediaSearchQueryDto = z.infer<typeof sMediaSearchQueryDto>;

export type GetLatestFrameRequest = z.infer<typeof sGetLatestFrameRequest>;

export type MediaSearchMatchDto = {
  relevance: number;
  providerAssignedRef: string;
  deviceId: string;
  probability: number;
  objectKind: string;
  startTime: number;
  endTime: number | null;
};
