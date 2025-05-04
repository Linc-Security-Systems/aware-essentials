import z from 'zod';

export const sCreatePlaybackControllerRequest = z.object({
  sources: z.array(z.string().nonempty()),
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
