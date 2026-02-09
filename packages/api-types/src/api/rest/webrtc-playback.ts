import z from 'zod';

const playbackSource = z.object({
  deviceId: z.string().nonempty(),
  streamId: z.string().nonempty(),
});

export const sCreatePlaybackControllerRequest = z.object({
  sources: z.array(playbackSource),
  initTime: z.number().nonnegative(),
});

export type CreatePlaybackControllerRequest = z.infer<
  typeof sCreatePlaybackControllerRequest
>;

export const sCreatePlaybackControllerResponse = z.object({
  id: z.string().nonempty(),
});

export type CreatePlaybackControllerResponse = z.infer<
  typeof sCreatePlaybackControllerResponse
>;
