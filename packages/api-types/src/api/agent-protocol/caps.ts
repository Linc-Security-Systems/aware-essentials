import { z } from 'zod';
import { sDeviceType } from '../../objects';

export const sDeviceSelector = z.object({
  types: z.array(sDeviceType),
  providers: z.array(z.string()),
});

export const sDeviceCaps = z.object({
  commands: z.array(z.string()),
  queries: z.array(z.string()),
  events: z.array(z.string()),
  state: z.array(z.string()),
});

export const sCapsReportEntry = sDeviceCaps.and(sDeviceSelector.partial());

export const sCapsReport = z.array(sCapsReportEntry);

export type DeviceSelector = z.infer<typeof sDeviceSelector>;
export type DeviceCaps = z.infer<typeof sDeviceCaps>;
export type CapsReportEntry = z.infer<typeof sCapsReportEntry>;
export type CapsReport = z.infer<typeof sCapsReport>;
