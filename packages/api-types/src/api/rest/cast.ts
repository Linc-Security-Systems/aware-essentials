import z from 'zod';

export const sCastCamerasRequest = z
  .array(
    z.object({
      cameraId: z.string().nonempty(),
      streamId: z.string().nonempty(),
    }),
  )
  .min(1);

export type CastCamerasRequest = z.infer<typeof sCastCamerasRequest>;
