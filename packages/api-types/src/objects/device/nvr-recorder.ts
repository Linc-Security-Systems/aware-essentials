import { z } from 'zod';

export const NVR_RECORDER = 'nvr-recorder';

export const sRecorderSpecs = z.object({});
export type RecorderSpecs = z.infer<typeof sRecorderSpecs>;

export const sRecorderStreamStateDto = z.object({
  upstreamState: z.enum(['connecting', 'connected', 'disconnected', 'error']),
  upstreamError: z.string().nonempty().nullable(),
  isRecording: z.boolean(),
  head: z.number().nullable(),
  tail: z.number().nullable(),
  totalSize: z.number().nullable(),
  totalLengthMs: z.number().nullable(),
});

export type RecorderStreamStateDto = z.infer<typeof sRecorderStreamStateDto>;

export const sRecorderStateDto = z.object({
  connected: z.boolean(),
  availableDiskSpace: z.number().nullable(),
  totalDiskSpace: z.number().nullable(),
  highWatermark: z.number().nullable(),
  lowWatermark: z.number().nullable(),
  cameras: z.record(z.string(), z.record(z.string(), sRecorderStreamStateDto)),
});

export type RecorderStateDto = z.infer<typeof sRecorderStateDto>;
