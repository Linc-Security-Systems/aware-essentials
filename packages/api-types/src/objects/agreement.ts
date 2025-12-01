import { z } from 'zod';

export const sAgreementDto = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1).max(64),
  content: z.string().min(1),
  createdOn: z.string().date(),
  lastModifiedOn: z.string().date(),
});

export type AgreementDto = z.infer<typeof sAgreementDto>;
