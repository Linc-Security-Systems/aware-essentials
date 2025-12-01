import { z } from 'zod';

export const sSecurityLevelDto = z.object({
  id: z.string().uuid(),
  order: z.number().int().min(0),
  name: z.string().max(64),
  active: z.boolean(),
  color: z.string().length(6),
  checkFrequency: z.number().int().min(0).max(100),
  checkOnExit: z.boolean(),
  default: z.boolean(),
});

export type SecurityLevelDto = z.infer<typeof sSecurityLevelDto>;
