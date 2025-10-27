import { z } from 'zod';

export const RECORDER = 'recorder';

export const sRecorderSpecs = z.object({});
export type RecorderSpecs = z.infer<typeof sRecorderSpecs>;

export const sRecorderStateDto = z.object({
  connected: z.boolean(),
});

export type RecorderStateDto = z.infer<typeof sRecorderStateDto>;
