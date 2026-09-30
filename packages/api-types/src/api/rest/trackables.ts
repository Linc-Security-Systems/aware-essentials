import { z } from 'zod';
import { sTrackableKind } from '../../objects/trackable';

export const sTrackableProfileSnapshot = z.object({
  objectName: z.string().trim().max(255).optional(),
  objectKind: sTrackableKind.optional(),
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

const refineRetention = (v: { ttlSeconds: number; outOfDateSeconds: number }) =>
  v.outOfDateSeconds < v.ttlSeconds;
const retentionRefineMessage = {
  message: 'outOfDateSeconds must be less than ttlSeconds',
  path: ['outOfDateSeconds'],
};

const sTrackableRetentionValues = z.object({
  ttlSeconds: z.number().int().positive(),
  outOfDateSeconds: z.number().int().positive(),
});

// Adds a policy for a specific kind (the default policy always exists)
export const sCreateTrackableRetentionPolicyRequest = sTrackableRetentionValues
  .extend({ objectKind: sTrackableKind })
  .refine(refineRetention, retentionRefineMessage);

export type CreateTrackableRetentionPolicyRequest = z.infer<
  typeof sCreateTrackableRetentionPolicyRequest
>;

// Replaces both values, so the ttl/out-of-date relationship can be validated
// here rather than against stored values
export const sUpdateTrackableRetentionPolicyRequest =
  sTrackableRetentionValues.refine(refineRetention, retentionRefineMessage);

export type UpdateTrackableRetentionPolicyRequest = z.infer<
  typeof sUpdateTrackableRetentionPolicyRequest
>;
