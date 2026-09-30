import { z } from 'zod';

export const sTrackableKind = z.enum([
  //AIS
  'vessel',
  'base-station',
  'aid-to-navigation',
  'sar-aircraft',
]);

export type TrackableKind = z.infer<typeof sTrackableKind>;

export const sTrackableImageDto = z.object({
  imageId: z.uuid(),
  reviewed: z.boolean(),
  createdBy: z.uuid().nullable(),
  createdOn: z.string(),
  lastModifiedOn: z.string(),
});
export type TrackableImageDto = z.infer<typeof sTrackableImageDto>;

export const sTrackableProfileDto = z.object({
  id: z.string(),
  name: z.string().nullable(),
  kind: sTrackableKind.nullable(),
  isUserFavorite: z.boolean(),
  isGlobalFavorite: z.boolean(),
  images: z.array(sTrackableImageDto),
  createdOn: z.string(),
  lastModifiedOn: z.string(),
});
export type TrackableProfileDto = z.infer<typeof sTrackableProfileDto>;

export const sTrackableHistoryDto = z.array(
  z.object({
    timestamp: z.number(),
    longitude: z.number().min(-180).max(180).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    altitude: z.number().optional(),
  }),
);
export type TrackableHistoryDto = z.infer<typeof sTrackableHistoryDto>;
