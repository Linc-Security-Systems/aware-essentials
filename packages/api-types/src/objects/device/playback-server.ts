import { z } from 'zod';

export const PLAYBACK_SERVER = 'playback-server';

export const sPlaybackServerSpecs = z.object({});
export type PlaybackServerSpecs = z.infer<typeof sPlaybackServerSpecs>;

export const sPlaybackServerStateDto = z.object({
  connected: z.boolean(),
  activeSessions: z.array(z.string().nonempty()),
});

export type PlaybackServerStateDto = z.infer<typeof sPlaybackServerStateDto>;
