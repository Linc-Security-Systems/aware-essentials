import { z } from 'zod';

export const sSecurityLevelDto = z.object({
  id: z.string().uuid(),
  order: z.number().int().min(0),
  name: z.string().max(64),
  active: z.boolean(),
  color: z.string().length(6),
  checkFrequency: z.number().int().min(0).max(100),
  checkOnExit: z.boolean(),
});

export const sAddSecurityLevelRequest = sSecurityLevelDto.omit({
  id: true,
});
export const sUpdateSecurityLevelRequest = sAddSecurityLevelRequest.partial();

export type SecurityLevelDto = z.infer<typeof sSecurityLevelDto>;
export type AddSecurityLevelRequest = z.infer<typeof sAddSecurityLevelRequest>;
export type UpdateSecurityLevelRequest = z.infer<
  typeof sUpdateSecurityLevelRequest
>;
