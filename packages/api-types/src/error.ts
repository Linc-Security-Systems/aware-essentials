import { z } from 'zod';

export const sErrorResponse = z.object({
  code: z.string(),
  message: z.string(),
});

export type ErrorResponse = z.infer<typeof sErrorResponse>;

export const isErrorResponse = (obj: unknown): obj is ErrorResponse =>
  sErrorResponse.safeParse(obj).success;
