import z from 'zod';

export const sPersonAgeementDto = z.object({
  personId: z.string(),
  agreementId: z.string(),
  agreementImage: z.string(),
  createdOn: z.string().date(),
  lastModifiedOn: z.string().date(),
});

export type PersonAgreementDto = z.infer<typeof sPersonAgeementDto>;

export const sCreatePersonAgreementRequest = z.object({
  personId: z.string(),
  agreementId: z.string(),
  agreementImage: z.string(),
});

export type CreatePersonAgreementRequest = z.infer<
  typeof sCreatePersonAgreementRequest
>;
