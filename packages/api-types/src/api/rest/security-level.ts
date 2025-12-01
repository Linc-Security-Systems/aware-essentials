import { sSecurityLevelDto } from '../../objects/security-level';
import { z } from 'zod';

export const sAddSecurityLevelRequest = sSecurityLevelDto.omit({
  id: true,
});
export const sUpdateSecurityLevelRequest = sAddSecurityLevelRequest.partial();

export type AddSecurityLevelRequest = z.infer<typeof sAddSecurityLevelRequest>;
export type UpdateSecurityLevelRequest = z.infer<
  typeof sUpdateSecurityLevelRequest
>;
