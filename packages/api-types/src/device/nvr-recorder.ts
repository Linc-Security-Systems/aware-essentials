import { z } from 'zod';

export const NVR_RECORDER = 'nvr-recorder';

export const sRecorderSpecs = z.object({});
export type RecorderSpecs = z.infer<typeof sRecorderSpecs>;

export const sRecorderStateDto = z.object({
  connected: z.boolean(),
});

export type RecorderStateDto = z.infer<typeof sRecorderStateDto>;
