import z from 'zod';

export const sCreatePersonAgreementRequest = z.object({
  personId: z.string(),
  agreementId: z.string(),
  agreementImage: z.string(),
});

export type CreatePersonAgreementRequest = z.infer<
  typeof sCreatePersonAgreementRequest
>;
