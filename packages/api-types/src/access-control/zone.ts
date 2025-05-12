import z from 'zod';

export const sZoneDto = z.object({
  id: z.string(),
  displayName: z.string(),
  createdOn: z.string(),
  lastModifiedOn: z.string(),
  devices: z.array(z.string()),
  isGlobal: z.boolean(),
  refs: z.record(z.union([z.string(), z.array(z.string())])),
  version: z.number(),
});

export type ZoneDto = z.infer<typeof sZoneDto>;

export const sCreateZoneRequest = z.object({
  displayName: z.string().nonempty(),
  devices: z.array(z.string().nonempty()),
});

export type CreateZoneRequest = z.infer<typeof sCreateZoneRequest>;

export const sUpdateZoneRequest = z.object({
  displayName: z.string().optional(),
  devices: z.array(z.string().nonempty()).optional(),
});

export type UpdateZoneRequest = { id: string } & z.infer<
  typeof sUpdateZoneRequest
>;

export const sAddZoneDeviceRequest = z.object({
  deviceId: z.string().nonempty(),
});

export type AddZoneDeviceRequest = z.infer<typeof sAddZoneDeviceRequest>;

export type RemoveZoneDeviceRequest = AddZoneDeviceRequest;
