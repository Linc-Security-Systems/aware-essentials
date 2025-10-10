import z from 'zod';

export const sAgreementDto = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1).max(64),
  content: z.string().min(1),
  createdOn: z.string().date(),
  lastModifiedOn: z.string().date(),
});

export const sCreateAgreementRequest = sAgreementDto.omit({
  id: true,
  createdOn: true,
  lastModifiedOn: true,
});

export type AgreementDto = z.infer<typeof sAgreementDto>;

export type CreateAgreementRequest = z.infer<typeof sCreateAgreementRequest>;

export const sUpdateAgreementRequest = sCreateAgreementRequest.partial();

export type UpdateAgreementRequest = z.infer<typeof sUpdateAgreementRequest>;
