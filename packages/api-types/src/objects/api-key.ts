import { z } from 'zod';

export const sApiKeyDto = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1).max(128),
  prefix: z.string().min(8).max(16),
  createdOn: z.string().datetime(),
  lastModifiedOn: z.string().datetime(),
});

export type ApiKeyDto = z.infer<typeof sApiKeyDto>;
