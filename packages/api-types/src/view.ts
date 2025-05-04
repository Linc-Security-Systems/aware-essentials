import z from 'zod';

export const sLayoutArea = z.object({
  area: z.string().nonempty(),
  type: z.literal('layout'),
  layoutId: z.string().nonempty(),
});

export type LayoutArea = z.infer<typeof sLayoutArea>;

export const sLayoutSelectorArea = z.object({
  area: z.string().nonempty(),
  type: z.literal('layoutSelector'),
});

export type LayoutSelectorArea = z.infer<typeof sLayoutSelectorArea>;

export const sDeviceArea = z.object({
  area: z.string().nonempty(),
  type: z.literal('device'),
  deviceId: z.string().nonempty(),
});
export type DeviceArea = z.infer<typeof sDeviceArea>;

export const sDeviceCarouselArea = z.object({
  area: z.string().nonempty(),
  type: z.literal('deviceCarousel'),
  deviceIds: z.array(z.string().nonempty()),
  timeIntervalMs: z.number().nonnegative(),
});
export type DeviceCarouselArea = z.infer<typeof sDeviceCarouselArea>;

export type ViewAreaContents =
  | LayoutArea
  | LayoutSelectorArea
  | DeviceArea
  | DeviceCarouselArea;

export const sViewAreaContents = z.union([
  sLayoutArea,
  sLayoutSelectorArea,
  sDeviceArea,
  sDeviceCarouselArea,
]);

export const sViewConfig = z.object({
  rows: z.number(),
  columns: z.number(),
  areas: z.array(z.array(z.string().nonempty())),
  hotspotArea: z.string().optional(),
  contents: z.array(sViewAreaContents),
});

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

export type ViewConfig = z.infer<typeof sViewConfig>;

export const sViewInfo = z
  .object({
    name: z.string(),
    order: z.number(),
    isPublic: z.boolean(),
    isDefault: z.boolean(),
  })
  .and(sViewConfig);

export type ViewInfo = z.infer<typeof sViewInfo>;

export const sViewDto = z
  .object({
    id: z.string(),
    name: z.string(),
    order: z.number(),
    isPublic: z.boolean(),
    isDefault: z.boolean(),
    createdBy: z.string(),
    createdOn: z.string(),
    lastModifiedOn: z.string(),
  })
  .and(sViewConfig);

export type ViewDto = z.infer<typeof sViewDto>;

export type AddViewRequest = z.infer<typeof sAddViewRequest>;

export type UpdateViewRequest = { id: string } & z.infer<
  typeof sUpdateViewRequest
>;
