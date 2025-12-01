import { z } from 'zod';

export const sConversionTypeEnum = z.enum(['hex-to-decimal']);

export const sTokenConversionDto = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(64),
  type: sConversionTypeEnum,
  jsonData: z.object({}).passthrough(), // Allows any JSON object structure
});

export type TokenConversionDto = z.infer<typeof sTokenConversionDto>;
