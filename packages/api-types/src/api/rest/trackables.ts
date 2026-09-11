import { z } from 'zod';

export const sTrackableProfileSnapshot = z.object({
  objectName: z.string().trim().max(255).optional(),
  objectKind: z.string().trim().max(64).optional(),
});

export const sSetTrackableFavoriteRequest = sTrackableProfileSnapshot;
export type SetTrackableFavoriteRequest = z.infer<
  typeof sSetTrackableFavoriteRequest
>;

export const sCreateTrackableRequest = sTrackableProfileSnapshot.extend({
  objectId: z.string().trim().min(1).max(64),
});
export type CreateTrackableRequest = z.infer<typeof sCreateTrackableRequest>;

export const sUpdateTrackableRequest = sTrackableProfileSnapshot;
export type UpdateTrackableRequest = z.infer<typeof sUpdateTrackableRequest>;

export const sAttachTrackableImageRequest = sTrackableProfileSnapshot.extend({
  imageId: z.uuid(),
  reviewed: z.boolean().optional(),
});
export type AttachTrackableImageRequest = z.infer<
  typeof sAttachTrackableImageRequest
>;

export const sSetTrackableImageReviewedRequest = z.object({
  reviewed: z.boolean(),
});
export type SetTrackableImageReviewedRequest = z.infer<
  typeof sSetTrackableImageReviewedRequest
>;
