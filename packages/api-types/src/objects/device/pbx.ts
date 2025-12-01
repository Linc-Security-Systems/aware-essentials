import { z } from 'zod';

export const PBX = 'pbx' as const;

// SPECS

export const sPbxSpecs = z.object({
  sipWsUrl: z.string(),
});

export type PbxSpecs = z.infer<typeof sPbxSpecs>;
