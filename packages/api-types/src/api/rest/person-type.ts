import { sPersonTypeDto } from '../../objects/person-type';
import { z } from 'zod';

export const sCreatePersonTypeRequest = sPersonTypeDto.omit({
  createdOn: true,
  lastModifiedOn: true,
});

export type CreatePersonTypeRequest = z.infer<typeof sCreatePersonTypeRequest>;

export const sUpdatePersonTypeRequest = sCreatePersonTypeRequest
  .partial()
  .omit({ id: true });

export type UpdatePersonTypeRequest = z.infer<typeof sUpdatePersonTypeRequest>;
