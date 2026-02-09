import { z } from 'zod';
import {
  sProviderMetadata,
  sDeviceRelationSide,
  sDeviceType,
  sEventDescription,
  sDeviceRelationDto,
  DeviceType,
  sEventVariantDescription,
} from '../../objects';

export const sAddDeviceRequest = z.object({
  name: z.string().nonempty(),
  foreignRef: z.string().nonempty(),
  notes: z.string().nullable(),
  provider: z.string().nonempty(),
  providerMetadata: sProviderMetadata,
  tags: z.array(z.string().nonempty()),
  relations: z.array(sDeviceRelationSide),
  type: sDeviceType,
  specs: z.object({}).catchall(z.unknown()).optional(),
});

export const sUpdateDeviceRequest = z.object({
  id: z.string().nonempty(),
  name: z.string().optional(),
  notes: z.string().nullable().optional(),
  providerMetadata: z.object({}).catchall(z.unknown()).optional(),
  specs: z.object({}).catchall(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  relations: z.array(sDeviceRelationSide).optional(),
  enabled: z.boolean().optional(),
});

export const sOverrideDeviceSpecsRequest = z.object({
  id: z.string(),
  specs: z.object({}).catchall(z.unknown()),
  specUpdates: z
    .array(z.object({ path: z.string(), value: z.unknown() }))
    .optional(),
});

export const sAddDevicePresetRequest = z.object({
  name: z.string().nonempty(),
  params: z.object({}).catchall(z.unknown()),
  assignedRef: z.string().nullable(),
  isDefault: z.boolean(),
  deviceId: z.string().nonempty(),
});

export const sUpdateDevicePresetRequest = z.object({
  name: z.string().optional(),
  isDefault: z.boolean().optional(),
  assignedRef: z.string().nullable().optional(),
  deviceId: z.string().nonempty(),
  presetId: z.string().nonempty(),
});

export const sRemoveDevicePresetRequest = z.object({
  deviceId: z.string().nonempty(),
  presetId: z.string().nonempty(),
});

export const sGetEventCatalogResponse = z.array(sEventDescription);

export const sSetUnsetRelationRequest = sDeviceRelationDto;

export type AddDeviceRequest = z.infer<typeof sAddDeviceRequest>;

export type UpdateDeviceRequest = z.infer<typeof sUpdateDeviceRequest>;

export type OverrideDeviceSpecsRequest = z.infer<
  typeof sOverrideDeviceSpecsRequest
>;

export type AddDevicePresetRequest = z.infer<typeof sAddDevicePresetRequest>;

export type UpdateDevicePresetRequest = z.infer<
  typeof sUpdateDevicePresetRequest
>;

export type RemoveDevicePresetRequest = z.infer<
  typeof sRemoveDevicePresetRequest
>;

export type SetUnsetDeviceRelationRequest = z.infer<
  typeof sSetUnsetRelationRequest
>;

export type DeviceSearchCriteria = {
  type: DeviceType;
};

export type EventVariantDescription = z.infer<typeof sEventVariantDescription>;

export type GetEventCatalogResponse = z.infer<typeof sGetEventCatalogResponse>;
