import z from 'zod';
import { sCredentialType } from '../primitives';

export const sCredentialValue = z.union([
  z.string().nonempty(),
  z.record(z.string(), z.unknown()),
]);

export const sAssignedCredential = z.object({
  type: sCredentialType,
  value: sCredentialValue,
  note: z.string().nullable(),
});

export type CredentialValue = z.infer<typeof sCredentialValue>;

export type AssignedCredential = z.infer<typeof sAssignedCredential>;
