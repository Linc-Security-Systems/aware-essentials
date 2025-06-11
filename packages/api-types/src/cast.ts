import z from 'zod';

export const sCastCamerasRequest = z.object({
  cameraIds: z.array(z.string().nonempty()).min(1),
});

export type CastCamerasRequest = z.infer<typeof sCastCamerasRequest>;
