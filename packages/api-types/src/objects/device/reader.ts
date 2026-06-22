import { z } from 'zod';
import { sCredentialType } from '../../primitives/credential-type';

export const READER = 'reader' as const;

// SPECS

export const sReaderSpecs = z.object({
  credentialTypes: z.array(sCredentialType).optional(),
});

export type ReaderSpecs = z.infer<typeof sReaderSpecs>;
