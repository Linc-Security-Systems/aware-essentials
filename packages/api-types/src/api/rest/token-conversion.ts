import { sTokenConversionDto } from '../../objects/token-conversion';
import { z } from 'zod';

export const sAddTokenConversionRequest = sTokenConversionDto.omit({
  id: true,
});
export const sUpdateTokenConversionRequest =
  sAddTokenConversionRequest.partial();

export type AddTokenConversionRequest = z.infer<
  typeof sAddTokenConversionRequest
>;
export type UpdateTokenConversionRequest = z.infer<
  typeof sUpdateTokenConversionRequest
>;
