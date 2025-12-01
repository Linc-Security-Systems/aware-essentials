import { sAgreementDto } from '../../objects/agreement';
import z from 'zod';

export const sCreateAgreementRequest = sAgreementDto.omit({
  id: true,
  createdOn: true,
  lastModifiedOn: true,
});

export type CreateAgreementRequest = z.infer<typeof sCreateAgreementRequest>;

export const sUpdateAgreementRequest = sCreateAgreementRequest.partial();

export type UpdateAgreementRequest = z.infer<typeof sUpdateAgreementRequest>;
