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

// reusable device argument. This schema can be checked at runtime to see if it's a device ID or full device info and substituted accordingly.
export const sDeviceParam = sDeviceId.or(sAgentDeviceInfo);
