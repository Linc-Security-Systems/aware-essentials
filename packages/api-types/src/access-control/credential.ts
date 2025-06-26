import z from 'zod';

export const sCredentialType = z.enum(['card', 'pin', 'fingerprint']);

export const sAssignedCredential = z.object({
  type: sCredentialType,
  value: z.string().nonempty(),
  note: z.string().nullable(),
});

export type CredentialType = z.infer<typeof sCredentialType>;

export type AssignedCredential = z.infer<typeof sAssignedCredential>;
