import { z } from 'zod';

export const NVR_RECORDER = 'nvr-recorder';

export const sRecorderSpecs = z.object({});
export type RecorderSpecs = z.infer<typeof sRecorderSpecs>;

export const sRecorderStreamStateDto = z.object({
  upstreamState: z.enum(['connecting', 'connected', 'disconnected', 'error']),
  upstreamError: z.string().nonempty().nullable(),
  isRecording: z.boolean(),
});

export type RecorderStreamStateDto = z.infer<typeof sRecorderStreamStateDto>;

export const sRecorderStateDto = z.object({
  connected: z.boolean(),
  cameras: z.record(z.string(), z.record(z.string(), sRecorderStreamStateDto)),
});

export type RecorderStateDto = z.infer<typeof sRecorderStateDto>;
