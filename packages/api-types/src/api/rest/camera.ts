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

export const sAddCameraStreamRs = z.object({
  id: z.string().nonempty(),
  ffmpegCommandTemplate: z.string().nonempty(),
});

export const sDeleteCameraStreamRq = z.object({
  cameraId: z.string().nonempty(),
  streamId: z.string().nonempty(),
});

export const sDeleteCameraStreamRs = z.object({});

export type AddCameraRq = z.infer<typeof sAddCameraRq>;
export type AddCameraRs = z.infer<typeof sAddCameraRs>;
export type AddCameraStreamRq = z.infer<typeof sAddCameraStreamRq>;
export type AddCameraStreamRs = z.infer<typeof sAddCameraStreamRs>;
export type DeleteCameraStreamRq = z.infer<typeof sDeleteCameraStreamRq>;
export type DeleteCameraStreamRs = z.infer<typeof sDeleteCameraStreamRs>;
