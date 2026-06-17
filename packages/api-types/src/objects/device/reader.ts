import { z } from 'zod';

export const READER = 'reader' as const;

// SPECS

export const sReaderSpecs = z.object({
  canEnrollFingerprint: z.boolean().optional(),
});

export type ReaderSpecs = z.infer<typeof sReaderSpecs>;
