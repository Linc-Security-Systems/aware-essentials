import { z } from 'zod';

/**
 * What a layout's document is, fixed when the layout is created:
 * - `image`: a plan image (SVG/PNG); devices are placed on the image.
 * - `map`: the world map; devices are placed on the map.
 * - `3d`: a 3D model (model.json plus plan images); devices are placed on the model's levels, in metres.
 */
export const sLayoutKind = z.enum(['image', 'map', '3d']);

export type LayoutKind = z.infer<typeof sLayoutKind>;

const sPoint = z.tuple([z.number(), z.number()]);

/** Four points in a camera's picture, as fractions of its width and height, and the four level points they show. */
export const sCameraCalibration = z.object({
  img: z.array(sPoint).length(4),
  level: z.array(sPoint).length(4),
});

export type CameraCalibration = z.infer<typeof sCameraCalibration>;

/** Placement attributes that only some device types use. Absent keys take the device type's defaults. */
export const sLayoutDeviceExtras = z.object({
  width: z
    .number()
    .min(0.4)
    .max(4)
    .optional()
    .describe('Door: width of the doorway in metres'),
  hinge: z
    .enum(['start', 'end'])
    .optional()
    .describe(
      'Door: the end of the doorway, along its rotation, the hinge is at (default start)',
    ),
  opens: z
    .enum(['right', 'left'])
    .optional()
    .describe(
      'Door: the side of the doorway, looking along its rotation, the door swings to (default right)',
    ),
  size: z
    .number()
    .min(0.3)
    .max(6)
    .optional()
    .describe('Size of the device marker in metres'),
  room: z
    .string()
    .min(1)
    .max(64)
    .optional()
    .describe(
      "Room of the layout's document the device belongs to, when not the one it stands in",
    ),
  viewId: z
    .string()
    .nonempty()
    .optional()
    .describe('View to open from the device'),
  calibration: sCameraCalibration
    .optional()
    .describe("Camera: maps points in the camera's picture to its level"),
  zoneRooms: z
    .record(z.string().min(1).max(128), z.string().min(1).max(64))
    .optional()
    .describe(
      "Camera: the detection provider's zone names, to rooms of the layout's document",
    ),
});

export type LayoutDeviceExtras = z.infer<typeof sLayoutDeviceExtras>;

/**
 * A device placed on a layout. What x, y and rotation mean depends on the layout's kind:
 * - `image` and `map`: a position on the image or map, as the layout editor stores it.
 * - `3d`: metres on the level, x along the model's x axis (towards the bow) and y along its z axis; rotation is the
 *   heading in degrees, 0 towards +x and 90 towards +y; scale is 1.
 *
 * In requests, `level`, `height` and `extras` left out keep their stored values, and null clears them.
 */
export const sLayoutDeviceDto = z.object({
  deviceId: z.string(),
  x: z.number(),
  y: z.number(),
  scale: z.number(),
  rotation: z.number(),
  fov: z.number(),
  far: z.number(),
  displayAs: z.string().nullable(),
  level: z
    .string()
    .min(1)
    .max(64)
    .nullable()
    .optional()
    .describe(
      "Level of the layout's document the device is on (3d: the model's deck id)",
    ),
  height: z
    .number()
    .min(0)
    .max(100)
    .nullable()
    .optional()
    .describe('Metres above the level'),
  extras: sLayoutDeviceExtras.nullable().optional(),
});

export type LayoutDeviceDto = z.infer<typeof sLayoutDeviceDto>;

const sLayoutBase = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number(),
  isDefault: z.boolean(),
  devices: z.array(sLayoutDeviceDto),
  colorize: z.boolean(),
  placementsRev: z
    .number()
    .int()
    .describe(
      'Revision of the placements. Send it back when saving devices, to be refused if someone else saved meanwhile.',
    ),
  map: z.boolean().describe('True when kind is map'),
  createdOn: z.string(),
  lastModifiedOn: z.string(),
});

export const sImageLayoutDto = sLayoutBase.extend({
  kind: z.literal('image'),
  imageUrl: z.string(),
  thumbnailUrl: z.string().optional(),
});

export const sMapLayoutDto = sLayoutBase.extend({
  kind: z.literal('map'),
  imageUrl: z
    .string()
    .optional()
    .describe('Present when the map layout was created with an image'),
  thumbnailUrl: z
    .string()
    .optional()
    .describe('Present when the map layout was created with an image'),
});

export const sModelLayoutDto = sLayoutBase.extend({
  kind: z.literal('3d'),
});

export const sLayoutDto = z.discriminatedUnion('kind', [
  sImageLayoutDto,
  sMapLayoutDto,
  sModelLayoutDto,
]);

export type ImageLayoutDto = z.infer<typeof sImageLayoutDto>;
export type MapLayoutDto = z.infer<typeof sMapLayoutDto>;
export type ModelLayoutDto = z.infer<typeof sModelLayoutDto>;
export type LayoutDto = z.infer<typeof sLayoutDto>;

/** The document of a `3d` layout: its model definition and the plan images the definition names. */
export const sLayoutModelDto = z.object({
  definition: z.record(z.string(), z.unknown()),
  plans: z.array(
    z.object({
      name: z.string().describe('Name the definition refers to the plan by'),
      url: z.string(),
    }),
  ),
});

export type LayoutModelDto = z.infer<typeof sLayoutModelDto>;
