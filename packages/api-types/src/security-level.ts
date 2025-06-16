import { z } from 'zod';

export const sSecurityLevelDto = z.object({
  id: z.number(),
  name: z.string().max(64),
  active: z.boolean(),
  color: z.string().length(6),
});

export const sAddSecurityLevelRequest = sSecurityLevelDto.omit({ id: true });
export const sUpdateSecurityLevelRequest = sAddSecurityLevelRequest.partial();

export type SecurityLevelDto = z.infer<typeof sSecurityLevelDto>;
export type AddSecurityLevelRequest = z.infer<typeof sAddSecurityLevelRequest>;
export type UpdateSecurityLevelRequest = z.infer<
  typeof sUpdateSecurityLevelRequest
>;
