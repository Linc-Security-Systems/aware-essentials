import { sLayoutDeviceDto } from '../../objects/layout';
import z from 'zod';

const sAddLayoutBase = z.object({
  name: z.string().nonempty(),
  order: z.number().optional(),
  devices: z.array(sLayoutDeviceDto),
  colorize: z.boolean(),
});

export const sAddImageLayoutRequest = sAddLayoutBase.extend({
  kind: z.literal('image'),
  thumbnailId: z.string().nonempty(),
  imageId: z.string().nonempty(),
});

export const sAddMapLayoutRequest = sAddLayoutBase.extend({
  kind: z.literal('map'),
});

/** An image layout, or a map layout when `map` is true, chosen by a flag rather than by `kind`. */
export const sAddImageOrMapLayoutRequest = sAddLayoutBase.extend({
  thumbnailId: z.string().nonempty(),
  imageId: z.string().nonempty(),
  map: z.boolean().describe('True for a map layout, false for an image layout'),
});

/** `3d` layouts are created by importing their model (POST /layouts/models). */
export const sAddLayoutRequest = z.union([
  z.discriminatedUnion('kind', [sAddImageLayoutRequest, sAddMapLayoutRequest]),
  sAddImageOrMapLayoutRequest,
]);

export type AddImageLayoutRequest = z.infer<typeof sAddImageLayoutRequest>;
export type AddMapLayoutRequest = z.infer<typeof sAddMapLayoutRequest>;
export type AddImageOrMapLayoutRequest = z.infer<
  typeof sAddImageOrMapLayoutRequest
>;
export type AddLayoutRequest = z.infer<typeof sAddLayoutRequest>;

export const sUpdateLayoutRequest = z.object({
  name: z.string().optional(),
  thumbnailId: z
    .string()
    .optional()
    .describe('Not for 3d layouts, which have no image'),
  imageId: z
    .string()
    .optional()
    .describe('Not for 3d layouts, which have no image'),
  order: z.number().optional(),
  isDefault: z.boolean().optional(),
  devices: z.array(sLayoutDeviceDto).optional(),
  placementsRev: z
    .number()
    .int()
    .optional()
    .describe(
      "The layout's placementsRev the devices were edited from. When sent with devices, the save is refused if someone else saved meanwhile.",
    ),
  colorize: z.boolean().optional(),
  map: z
    .boolean()
    .optional()
    .describe('Ignored: a layout keeps the kind it was made with'),
});

export type UpdateLayoutRequest = { id: string } & z.infer<
  typeof sUpdateLayoutRequest
>;
