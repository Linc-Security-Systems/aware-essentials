import { z } from 'zod';

export const NVR_RECORDER = 'nvr-recorder';

export const sRecorderSpecs = z.object({});
export type RecorderSpecs = z.infer<typeof sRecorderSpecs>;

export const sRecorderStateDto = z.object({
  connected: z.boolean(),
  usedDiskSpace: z.number().nullable(),
  availableDiskSpace: z.number().nullable(),
  totalDiskSpace: z.number().nullable(),
  highWatermark: z.number().nullable(),
  lowWatermark: z.number().nullable(),
});

export type RecorderStateDto = z.infer<typeof sRecorderStateDto>;
