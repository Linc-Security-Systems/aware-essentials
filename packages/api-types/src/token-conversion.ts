import { z } from 'zod';

export const ConversionTypeEnum = z.enum(['hex-to-decimal']);

export const sTokenConversionDto = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(64),
  type: ConversionTypeEnum,
  jsonData: z.object({}).passthrough(), // Allows any JSON object structure
});

export const sAddTokenConversionRequest = sTokenConversionDto.omit({
  id: true,
});
export const sUpdateTokenConversionRequest =
  sAddTokenConversionRequest.partial();

export type TokenConversionDto = z.infer<typeof sTokenConversionDto>;
export type AddTokenConversionRequest = z.infer<
  typeof sAddTokenConversionRequest
>;
export type UpdateTokenConversionRequest = z.infer<
  typeof sUpdateTokenConversionRequest
>;
