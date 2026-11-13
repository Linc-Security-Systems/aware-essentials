import { z } from 'zod';

export const sLayoutLocationProps = z.object({
  name: z.string().trim().nonempty().max(128),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  zoom: z.number().min(0).max(24),
});

export type LayoutLocationProps = z.infer<typeof sLayoutLocationProps>;

export const sLayoutLocationDto = sLayoutLocationProps.extend({
  id: z.string(),
  layoutId: z.string(),
  order: z.number(),
  createdOn: z.string(),
  lastModifiedOn: z.string(),
});

export type LayoutLocationDto = z.infer<typeof sLayoutLocationDto>;
