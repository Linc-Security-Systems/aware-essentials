import { z } from 'zod';

export const sAppInfo = z.object({
  version: z.string(),
  releaseDate: z.string(),
  serverDeviceId: z.string(),
  alarmDeviceId: z.string(),
  globalZoneId: z.string(),
});

export type AppInfo = z.infer<typeof sAppInfo>;
