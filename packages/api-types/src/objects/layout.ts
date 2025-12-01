import { z } from 'zod';

export const sLayoutDeviceDto = z.object({
  deviceId: z.string(),
  x: z.number(),
  y: z.number(),
  scale: z.number(),
  rotation: z.number(),
  fov: z.number(),
  far: z.number(),
});

export type LayoutDeviceDto = z.infer<typeof sLayoutDeviceDto>;

export const sLayoutDto = z.object({
  id: z.string(),
  name: z.string(),
  thumbnailUrl: z.string(),
  imageUrl: z.string(),
  order: z.number(),
  isDefault: z.boolean(),
  devices: z.array(sLayoutDeviceDto),
  colorize: z.boolean(),
  createdOn: z.string(),
  lastModifiedOn: z.string(),
});

export type LayoutDto = z.infer<typeof sLayoutDto>;
