import z from 'zod';

export const sCredentialType = z.enum(['card', 'pin', 'fingerprint']);

export const sCredentialValue = z.union([
  z.string().nonempty(),
  z.record(z.unknown()),
]);

export const sAssignedCredential = z.object({
  type: sCredentialType,
  value: sCredentialValue,
  note: z.string().nullable(),
});

export type CredentialType = z.infer<typeof sCredentialType>;

export type CredentialValue = z.infer<typeof sCredentialValue>;

export type AssignedCredential = z.infer<typeof sAssignedCredential>;
