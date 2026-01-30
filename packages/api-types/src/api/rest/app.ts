import { z } from 'zod';

export const sPasswordPolicy = z.object({
  minLength: z.number().min(0).default(4),
  minSpecialChars: z.number().min(0).default(0),
  minDifferentCase: z.number().min(0).default(0),
  minDigits: z.number().min(0).default(0),
});

export const sAppInfo = z.object({
  version: z.string(),
  releaseDate: z.string(),
  serverDeviceId: z.string(),
  alarmDeviceId: z.string(),
  globalZoneId: z.string(),
  presenceTrackerId: z.string(),
  passwordPolicy: sPasswordPolicy,
});

export type AppInfo = z.infer<typeof sAppInfo>;
