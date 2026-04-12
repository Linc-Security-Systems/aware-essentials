import { z } from 'zod';

export const sAddCameraRq = z.object({
  displayName: z.string().nonempty(),
});

export const sAddCameraRs = z.object({
  id: z.string().nonempty(),
});

export const sAddCameraStreamRq = z.object({
  cameraId: z.string().nonempty(),
  displayName: z.string().nonempty(),
  rtspUrl: z.string().nonempty().nullable(),
});

export const sPatchCameraStreamRq = z.object({
  cameraId: z.string().nonempty(),
  streamId: z.string().nonempty(),
  displayName: z.string().nonempty().optional(),
  rtspUrl: z.string().nonempty().optional(),
});

export const sPatchCameraStreamRs = z.object({});

export const sAddCameraStreamRs = z.object({
  id: z.string().nonempty(),
  ffmpegCommandTemplate: z.string().nonempty(),
});

export const sDeleteCameraStreamRq = z.object({
  cameraId: z.string().nonempty(),
  streamId: z.string().nonempty(),
});

export const sDeleteCameraStreamRs = z.object({});

export const sBindStreamRecorderRq = z.object({
  cameraId: z.string().nonempty(),
  streamId: z.string().nonempty(),
  recorderId: z.string().nonempty(),
  retentionHours: z.number().int().positive().optional(),
  prebufferSeconds: z.number().int().nonnegative().optional(),
});

export const sBindStreamRecorderRs = z.object({});

export const sUnbindStreamRecorderRq = z.object({
  cameraId: z.string().nonempty(),
  streamId: z.string().nonempty(),
  recorderId: z.string().nonempty(),
});

export const sUnbindStreamRecorderRs = z.object({});

export type AddCameraRq = z.infer<typeof sAddCameraRq>;
export type AddCameraRs = z.infer<typeof sAddCameraRs>;
export type AddCameraStreamRq = z.infer<typeof sAddCameraStreamRq>;
export type AddCameraStreamRs = z.infer<typeof sAddCameraStreamRs>;
export type PatchCameraStreamRq = z.infer<typeof sPatchCameraStreamRq>;
export type PatchCameraStreamRs = z.infer<typeof sPatchCameraStreamRs>;
export type DeleteCameraStreamRq = z.infer<typeof sDeleteCameraStreamRq>;
export type DeleteCameraStreamRs = z.infer<typeof sDeleteCameraStreamRs>;
export type BindStreamRecorderRq = z.infer<typeof sBindStreamRecorderRq>;
export type BindStreamRecorderRs = z.infer<typeof sBindStreamRecorderRs>;
export type UnbindStreamRecorderRq = z.infer<typeof sUnbindStreamRecorderRq>;
export type UnbindStreamRecorderRs = z.infer<typeof sUnbindStreamRecorderRs>;
