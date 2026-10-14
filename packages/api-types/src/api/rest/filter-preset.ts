import { z } from 'zod';
import {
  sFilterPresetTarget,
  sFilterPresetValues,
} from '../../objects/filter-preset';

const sFilterPresetName = z.string().trim().min(1).max(128);

// Built-in presets are managed by the server and cannot be created through the API
export const sCreateFilterPresetRequest = z.object({
  target: sFilterPresetTarget,
  type: z.enum(['global', 'user']),
  name: sFilterPresetName,
  values: sFilterPresetValues,
});
export type CreateFilterPresetRequest = z.infer<
  typeof sCreateFilterPresetRequest
>;

// Target and type cannot change after creation
export const sUpdateFilterPresetRequest = z
  .object({
    name: sFilterPresetName,
    values: sFilterPresetValues,
  })
  .partial();
export type UpdateFilterPresetRequest = z.infer<
  typeof sUpdateFilterPresetRequest
>;

export const sFilterPresetQuery = z.object({
  target: sFilterPresetTarget.optional(),
});
export type FilterPresetQuery = z.infer<typeof sFilterPresetQuery>;
