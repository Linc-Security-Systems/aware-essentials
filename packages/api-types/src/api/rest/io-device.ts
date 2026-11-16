import { z } from 'zod';
import { sDeviceType } from '../../objects/device/any-device';

export const sIoSlot = z.object({
  deviceId: z.string().nonempty(),
  slot: z.string().nonempty(),
  inverted: z.boolean().optional(),
});

export type IoSlot = z.infer<typeof sIoSlot>;

export const sInputBindings = z.record(z.string(), sIoSlot);

export type InputBindings = z.infer<typeof sInputBindings>;

export const sOutputBindings = z.record(z.string(), sIoSlot);

export type OutputBindings = z.infer<typeof sOutputBindings>;

export interface DeviceFactoryProviderMetadata {
  templateName: string;
}

export const isDeviceFactoryProviderMetadata = (
  obj: any,
): obj is DeviceFactoryProviderMetadata => {
  return obj && obj.templateName && typeof obj.templateName === 'string';
};

const sDeviceIo = z.object({
  name: z.string(),
  displayName: z.string(),
  dataType: z.literal('boolean'),
});

export type DeviceIo = z.infer<typeof sDeviceIo>;

export const sDeviceTemplate = z.object({
  deviceType: sDeviceType,
  displayName: z.string(),
  description: z.string(),
  inputs: z.array(sDeviceIo),
  outputs: z.array(sDeviceIo),
});

export type DeviceTemplate = z.infer<typeof sDeviceTemplate>;

export const sAddCustomDeviceRequest = z.object({
  name: z.string().nonempty(),
  templateName: z.string().nonempty(),
});

export type AddCustomDeviceRequest = z.infer<typeof sAddCustomDeviceRequest>;

export const sUpdateCustomDeviceRequest = z.object({
  inputBindings: sInputBindings,
  outputBindings: sOutputBindings,
});

export type UpdateCustomDeviceRequest = { id: string } & z.infer<
  typeof sUpdateCustomDeviceRequest
>;

export const sCustomDeviceInfo = z.object({
  id: z.string(),
  name: z.string(),
  templateName: z.string(),
  inputBindings: sInputBindings,
  outputBindings: sOutputBindings,
});

export type CustomDeviceInfo = z.infer<typeof sCustomDeviceInfo>;
