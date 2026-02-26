/**
 * P R I M I T I V E S
 * These are the basic building blocks used throughout the API type definitions.
 * Funactionally, product components compare schema attribute types to these primitives - by reference equality - to provide custom handling
 * for common data types. We're not talking about int, string and that, we're talking about
 * domain-specific types like DeviceId, PresetId, Duration, URL, etc.
 */

import { z } from 'zod';
import {
  sAnyDeviceSpecs,
  sForeignDeviceInfo,
  sPresetDto,
} from './objects/device';

export const sDeviceId = z.string().nonempty();
export const sPresetId = z.string().nonempty();
export const sDeviceEvent = z.record(z.unknown());
export const sPersonId = z.string().nonempty();
export const sPersonTypeId = z.string().nonempty();
export const sZoneId = z.string().nonempty();
export const sMacroId = z.string().nonempty();
export const sUserId = z.string().nonempty();

export const sWorldObjectId = z.string().nonempty();

export const sIoInputSlotId = z.string().nonempty();

export type IoInputSlotId = z.infer<typeof sIoInputSlotId>;

export const sIoOutputSlotId = z.string().nonempty();

export type IoOutputSlotId = z.infer<typeof sIoOutputSlotId>;

// general
export const sDuration = z.number().min(0).describe('Duration in milliseconds');
export const sUrl = z.string().url().describe('A valid URL');

export const sFileResponse = z
  .object({
    mimeType: z.string().nonempty(),
    data: z.string().nonempty(),
  })
  .nullable();

export const sAgentDeviceInfo = z.intersection(
  sForeignDeviceInfo.merge(
    z.object({
      presets: z.array(sPresetDto),
    }),
  ),
  sAnyDeviceSpecs,
);

export type AgentDeviceInfo = z.infer<typeof sAgentDeviceInfo>;

export const sForeignDeviceId = z.tuple([
  z.string().nonempty().describe('Foreign system identifier'),
  z.string().nonempty().describe('Device identifier in foreign system'),
]);

// a pointer to a device, can be local device id, foreign device info, or full device info for agents
export const sDeviceParam = sDeviceId.or(sAgentDeviceInfo).or(sForeignDeviceId);

export type DeviceParam = z.infer<typeof sDeviceParam>;

export const sNotificationSeverity = z.enum(['info', 'warning', 'critical']);

export type NotificationSeverity = z.infer<typeof sNotificationSeverity>;

export const sCameraPresetInfo = z.object({
  name: z.string().nonempty(),
  isDefault: z.boolean(),
  values: z.unknown(),
});

export type CameraPresetInfo = z.infer<typeof sCameraPresetInfo>;

export const sCallState = z.enum([
  'connecting',
  'connected',
  'ringing',
  'terminated',
]);

export const sCallDirection = z.enum(['incoming', 'outgoing']);
