import { z } from 'zod';

// The page whose filter a preset applies to
export const sFilterPresetTarget = z.enum(['event-history']);
export type FilterPresetTarget = z.infer<typeof sFilterPresetTarget>;

// built-in = shipped with the server and read-only, global = shared with all users,
// user = visible to its creator only
export const sFilterPresetType = z.enum(['built-in', 'global', 'user']);
export type FilterPresetType = z.infer<typeof sFilterPresetType>;

// Filter values as the client defines them for the target; the server stores them as-is
export const sFilterPresetValues = z.record(z.string(), z.unknown());
export type FilterPresetValues = z.infer<typeof sFilterPresetValues>;

export const sFilterPresetDto = z.object({
  id: z.uuid(),
  systemCode: z.string().nullable(), // Stable identifier of a built-in preset, null otherwise
  target: sFilterPresetTarget,
  type: sFilterPresetType,
  name: z.string(),
  values: sFilterPresetValues,
  createdBy: z.uuid().nullable(), // null for built-in presets
  createdOn: z.string(),
  lastModifiedOn: z.string(),
});
export type FilterPresetDto = z.infer<typeof sFilterPresetDto>;
