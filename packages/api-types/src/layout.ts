import z from 'zod';

export const sLayoutDeviceDto = z.object({
  deviceId: z.string(),
  x: z.number(),
  y: z.number(),
  scale: z.number(),
  rotation: z.number(),
});

export type LayoutDeviceDto = z.infer<typeof sLayoutDeviceDto>;

export const sAddLayoutRequest = z.object({
  name: z.string().nonempty(),
  thumbnailId: z.string().nonempty(),
  imageId: z.string().nonempty(),
  order: z.number().optional(),
  devices: z.array(sLayoutDeviceDto),
  colorize: z.boolean(),
});

export type AddLayoutRequest = z.infer<typeof sAddLayoutRequest>;

export const sUpdateLayoutRequest = z.object({
  name: z.string().optional(),
  thumbnailId: z.string().optional(),
  imageId: z.string().optional(),
  order: z.number().optional(),
  isDefault: z.boolean().optional(),
  devices: z.array(sLayoutDeviceDto).optional(),
  colorize: z.boolean().optional(),
});

export type UpdateLayoutRequest = { id: string } & z.infer<
  typeof sUpdateLayoutRequest
>;

export const sLayoutDto = z.object({
  id: z.string(),
  name: z.string(),
  thumbnailUrl: z.string(),
  imageUrl: z.string(),
  order: z.number(),
  isDefault: z.boolean(),
  devices: z.array(sLayoutDeviceDto),
  colorize: z.boolean().optional(),
  createdOn: z.string(),
  lastModifiedOn: z.string(),
});

export type LayoutDto = z.infer<typeof sLayoutDto>;
