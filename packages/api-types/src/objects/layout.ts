import { z } from 'zod';

export const sLayoutDeviceDto = z.object({
  deviceId: z.string(),
  x: z.number(),
  y: z.number(),
  scale: z.number(),
  rotation: z.number(),
  fov: z.number(),
  far: z.number(),
  displayAs: z.string().nullable(),
});

export type LayoutDeviceDto = z.infer<typeof sLayoutDeviceDto>;

/**
 * Where a map layout centres when it loads or when "home" is pressed.
 * - browser: the workstation's own geolocation (fallback behaviour)
 * - location: a fixed layout location (see homeLocationId)
 * Further sources (e.g. vessel GPS) can be added later.
 */
export const sLayoutHomeSource = z.enum(['browser', 'location']);

export type LayoutHomeSource = z.infer<typeof sLayoutHomeSource>;

export const sLayoutDto = z.object({
  id: z.string(),
  name: z.string(),
  thumbnailUrl: z.string(),
  imageUrl: z.string(),
  order: z.number(),
  isDefault: z.boolean(),
  devices: z.array(sLayoutDeviceDto),
  colorize: z.boolean(),
  map: z.boolean(),
  homeSource: sLayoutHomeSource,
  homeLocationId: z.string().nullable(),
  createdOn: z.string(),
  lastModifiedOn: z.string(),
});

export type LayoutDto = z.infer<typeof sLayoutDto>;
