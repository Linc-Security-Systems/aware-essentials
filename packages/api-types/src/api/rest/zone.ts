import { sZoneProps } from '../../objects/zone';
import z from 'zod';

export const sCreateZoneRequest = sZoneProps;

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

export type AddZoneDeviceRequest = { zoneId: string } & z.infer<
  typeof sAddZoneDeviceRequest
>;

export type RemoveZoneDeviceRequest = AddZoneDeviceRequest;
