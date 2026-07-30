import { z } from 'zod';

export const sPasswordPolicy = z.object({
  minLength: z.number().min(0).default(4),
  minSpecialChars: z.number().min(0).default(0),
  minDifferentCase: z.number().min(0).default(0),
  minDigits: z.number().min(0).default(0),
});

export const sUaExtensionInfo = z.object({
  name: z.string().nonempty(),
  url: z.string().nonempty(),
});

export const sAppInfo = z.object({
  version: z.string(),
  releaseDate: z.string(),
  serverDeviceId: z.string(),
  alarmDeviceId: z.string(),
  presenceTrackerId: z.string(),
  passwordPolicy: sPasswordPolicy,
  mapTileServerUrl: z.string(),
  userAgentExtensions: z.array(sUaExtensionInfo),
  licenseInfo: z
    .object({
      careStart: z.string().optional(),
      careEnd: z.string().optional(),
      licensedAssetCount: z.record(z.string(), z.number().int().nonnegative()),
      actualAssetCount: z.record(z.string(), z.number().int().nonnegative()),
    })
    .optional(),
});

export type AppInfo = z.infer<typeof sAppInfo>;
