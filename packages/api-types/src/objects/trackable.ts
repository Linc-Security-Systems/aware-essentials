import { z } from 'zod';

export const sTrackableImageDto = z.object({
  imageId: z.uuid(),
  reviewed: z.boolean(),
  createdBy: z.uuid().nullable(),
  createdOn: z.string(),
  lastModifiedOn: z.string(),
});
export type TrackableImageDto = z.infer<typeof sTrackableImageDto>;

export const sTrackableProfileDto = z.object({
  objectId: z.string(),
  objectName: z.string().nullable(),
  objectKind: z.string().nullable(),
  isUserFavorite: z.boolean(),
  isGlobalFavorite: z.boolean(),
  images: z.array(sTrackableImageDto),
  createdOn: z.string(),
  lastModifiedOn: z.string(),
});
export type TrackableProfileDto = z.infer<typeof sTrackableProfileDto>;
