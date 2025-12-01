import { sPersonProps } from '../../objects/person';
import z from 'zod';
export const sCreatePersonRequest = sPersonProps;

export const sUpdatePersonRequest = sCreatePersonRequest
  .extend({
    archived: z.boolean(),
  })
  .partial();

export type CreatePersonRequest = z.infer<typeof sCreatePersonRequest>;

export type UpdatePersonRequest = { id: string } & z.infer<
  typeof sUpdatePersonRequest
>;
