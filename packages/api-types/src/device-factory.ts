import z from 'zod';
import { DeviceType } from './device/any-device';

export const sIoSlot = z.object({
  deviceId: z.string().nonempty(),
  slot: z.string().nonempty(),
});

export type IoSlot = z.infer<typeof sIoSlot>;

export const sInputBindings = z.record(sIoSlot);

export type InputBindings = z.infer<typeof sInputBindings>;

export const sOutputBindings = z.record(sIoSlot);

export type OutputBindings = z.infer<typeof sOutputBindings>;

export interface DeviceFactoryProviderMetadata {
  templateName: string;
}

export const isDeviceFactoryProviderMetadata = (
  obj: any,
): obj is DeviceFactoryProviderMetadata => {
  return obj && obj.templateName && typeof obj.templateName === 'string';
};

export interface DeviceIo {
  name: string;
  displayName: string;
  dataType: 'boolean';
}

export interface DeviceTemplate {
  deviceType: DeviceType;
  displayName: string;
  description: string;
  inputs: DeviceIo[];
  outputs: DeviceIo[];
}

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

export type CustomDeviceInfo = {
  id: string;
  name: string;
  templateName: string;
  inputBindings: Record<string, IoSlot>;
  outputBindings: Record<string, IoSlot>;
};
