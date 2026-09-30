import { z } from 'zod';

export const sTrackableRetentionPolicyDto = z.object({
  id: z.uuid(),
  objectKind: z.string().nullable(), // null = the default policy, used by any kind without its own entry
  ttlSeconds: z.number().int().positive(), // Remove the trackable after this long without an update
  outOfDateSeconds: z.number().int().positive(), // Show the trackable as out of date (faded) after this long without an update
  createdOn: z.string(),
  lastModifiedOn: z.string(),
});
export type TrackableRetentionPolicyDto = z.infer<
  typeof sTrackableRetentionPolicyDto
>;
