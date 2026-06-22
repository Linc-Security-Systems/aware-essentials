import { z } from 'zod';

export const sCredentialType = z.enum([
  'card',
  'pin',
  'fingerprint',
  'face',
  'retina',
]);

export type CredentialType = z.infer<typeof sCredentialType>;
