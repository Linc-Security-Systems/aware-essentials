import { sAssignedCredential } from './credential';
import z from 'zod';

export const sPersonAccessRule = z.object({
  id: z.string(),
  displayName: z.string(),
});

export const sPersonDto = z.object({
  id: z.string(),
  firstName: z.string().min(1).max(64),
  lastName: z.string().min(1).max(64),
  position: z.string().nullable(),
  validFrom: z.string().datetime().nullable(),
  validTo: z.string().datetime().nullable(),
  accessSuspended: z.boolean(),
  archived: z.boolean(),
  staffMember: z.boolean(),
  createdOn: z.string(),
  lastModifiedOn: z.string(),
  avatarId: z.string().nullable(),
  credentials: z.array(sAssignedCredential),
  accessRules: z.array(sPersonAccessRule),
  customFields: z.record(z.string()).nullable(),
  refs: z.record(z.string()),
  version: z.number(),
});

export const sCreatePersonRequest = z.object({
  firstName: z.string().min(1).max(64),
  lastName: z.string().min(1).max(64),
  position: z.string().nullable(),
  accessSuspended: z.boolean(),
  staffMember: z.boolean(),
  validFrom: z.string().datetime().nullable(),
  validTo: z.string().datetime().nullable(),
  avatarId: z.string().nullable(),
  credentials: z.array(sAssignedCredential),
  accessRules: z.array(z.string().nonempty()),
  customFields: z.record(z.string()).nullable(),
});

export const sUpdatePersonRequest = sCreatePersonRequest
  .extend({
    archived: z.boolean(),
  })
  .partial();

export type PersonAccessRuleDto = z.infer<typeof sPersonAccessRule>;

export type PersonDto = z.infer<typeof sPersonDto>;

export type CreatePersonRequest = z.infer<typeof sCreatePersonRequest>;

export type UpdatePersonRequest = { id: string } & z.infer<
  typeof sUpdatePersonRequest
>;
