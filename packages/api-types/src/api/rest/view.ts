import { sViewConfig } from '../../objects/view';
import z from 'zod';

export const sAddViewRequest = z.object({
  name: z.string().nonempty(),
  order: z.number().optional(),
  isPublic: z.boolean(),
  isDefault: z.boolean().optional(),
  config: sViewConfig,
});

export const sUpdateViewRequest = z.object({
  name: z.string().optional(),
  order: z.number().optional(),
  isPublic: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  config: sViewConfig.optional(),
});

export type AddViewRequest = z.infer<typeof sAddViewRequest>;

export type UpdateViewRequest = { id: string } & z.infer<
  typeof sUpdateViewRequest
>;
