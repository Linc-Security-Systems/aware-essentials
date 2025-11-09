import { z } from 'zod';
import { sAnyDeviceSpecs, sForeignDeviceInfo, sPresetDto } from './device';

export const sDeviceId = z.string().uuid().nonempty();
export const sPresetId = z.string().uuid().nonempty();
export const sDeviceEvent = z.record(z.unknown());
export const sPersonId = z.string().uuid().nonempty();
export const sZoneId = z.string().uuid().nonempty();
export const sMacroId = z.string().uuid().nonempty();

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
  sForeignDeviceInfo,
  sAnyDeviceSpecs,
  z.object({
    presets: z.array(sPresetDto),
  }),
);

export const sForeignDeviceId = z.tuple([
  z.string().nonempty().describe('Foreign system identifier'),
  z.string().nonempty().describe('Device identifier in foreign system'),
]);

// a pointer to a device, can be local device id, foreign device info, or full device info for agents
export const sDeviceParam = sDeviceId.or(sAgentDeviceInfo).or(sForeignDeviceId);

export type DeviceParam = z.infer<typeof sDeviceParam>;

export const sNotificationSeverity = z.enum(['info', 'warning', 'critical']);

export type NotificationSeverity = z.infer<typeof sNotificationSeverity>;
