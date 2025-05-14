import z from 'zod';

export const sCredentialType = z.enum(['card', 'pin']);

export const sAssignedCredential = z.object({
  type: sCredentialType,
  value: z.string().nonempty(),
});

export type CredentialType = z.infer<typeof sCredentialType>;

export type AssignedCredential = z.infer<typeof sAssignedCredential>;
