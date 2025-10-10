import { sAssignedCredential } from './credential';
import z from 'zod';
import { sPersonAgeementDto } from './person-agreement';

export const sPersonAccessRule = z.object({
  id: z.string(),
  displayName: z.string(),
});

export const sPersonDto = z.object({
  id: z.string(),
  firstName: z.string().min(1).max(64),
  lastName: z.string().min(1).max(64),
  position: z.string().max(128).nullable(),
  validFrom: z.string().date().nullable(),
  validTo: z.string().date().nullable(),
  accessSuspended: z.boolean(),
  archived: z.boolean(),
  staffMember: z.boolean(),
  createdOn: z.string(),
  lastModifiedOn: z.string(),
  avatarId: z.string().nullable(),
  credentials: z.array(sAssignedCredential),
  accessRules: z.array(sPersonAccessRule),
  customFields: z.record(z.string()).nullable(),
  refs: z.record(z.union([z.string(), z.array(z.string())])),
  version: z.number(),
  type: z.string().min(1).max(64),
  agreements: z.array(sPersonAgeementDto),
});

export const sCreatePersonRequest = z.object({
  firstName: z.string().min(1).max(64),
  lastName: z.string().min(1).max(64),
  position: z.string().nullable(),
  accessSuspended: z.boolean(),
  staffMember: z.boolean(),
  validFrom: z.string().date().nullable(),
  validTo: z.string().date().nullable(),
  avatarId: z.string().nullable(),
  credentials: z.array(sAssignedCredential),
  accessRules: z.array(z.string().nonempty()),
  customFields: z.record(z.string()).nullable(),
  type: z.string().min(1).max(16),
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
