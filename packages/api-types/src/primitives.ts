import { z } from 'zod';

export const sDeviceId = z.string().uuid().nonempty();
export const sPresetId = z.string().uuid().nonempty();
export const sDeviceEvent = z.record(z.unknown());
export const sPersonId = z.string().uuid().nonempty();
export const sZoneId = z.string().uuid().nonempty();
export const sMacroId = z.string().uuid().nonempty();

// general
export const sDuration = z.number().min(0).describe('Duration in milliseconds');
export const sUrl = z.string().url().describe('A valid URL');
