import { sLayoutDeviceDto } from '../../objects/layout';
import z from 'zod';

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
