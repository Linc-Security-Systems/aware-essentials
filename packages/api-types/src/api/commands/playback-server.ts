import { sDeviceParam } from '../../primitives';
import { z } from 'zod';

// A playback session is named by its caller, so the same name can be
// commanded again (idempotently) and agreed on in advance.
export const sPlaybackSessionId = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/)
  .describe(
    'Name of the playback session, chosen by the caller: a letter or digit, then up to 63 letters, digits, ".", "_" or "-"',
  );

export const sPlaybackSessionCamera = z.object({
  camera: sDeviceParam,
  streamId: z.string().nonempty(),
});

export type PlaybackSessionCamera = z.infer<typeof sPlaybackSessionCamera>;

// COMMANDS
export const sOpenPlaybackSessionCommand = z.object({
  command: z.literal('playback-server.open-session'),
  params: z.object({
    sessionId: sPlaybackSessionId,
    cameras: z
      .array(sPlaybackSessionCamera)
      .min(1)
      .describe(
        'The complete list of cameras in the session; sent for an existing session it replaces the list',
      ),
    time: z
      .number()
      .int()
      .positive()
      .describe(
        'Initial position (unix ms); applies only when the session is created',
      ),
  }),
});

export type OpenPlaybackSessionCommand = z.infer<
  typeof sOpenPlaybackSessionCommand
>;

export const sClosePlaybackSessionCommand = z.object({
  command: z.literal('playback-server.close-session'),
  params: z.object({
    sessionId: sPlaybackSessionId,
  }),
});

export type ClosePlaybackSessionCommand = z.infer<
  typeof sClosePlaybackSessionCommand
>;

export const sPlayPlaybackSessionCommand = z.object({
  command: z.literal('playback-server.play'),
  params: z.object({
    sessionId: sPlaybackSessionId,
    rate: z.union([z.literal(1), z.literal(2)]),
  }),
});

export type PlayPlaybackSessionCommand = z.infer<
  typeof sPlayPlaybackSessionCommand
>;

export const sPausePlaybackSessionCommand = z.object({
  command: z.literal('playback-server.pause'),
  params: z.object({
    sessionId: sPlaybackSessionId,
  }),
});

export type PausePlaybackSessionCommand = z.infer<
  typeof sPausePlaybackSessionCommand
>;

export const sSeekPlaybackSessionCommand = z.object({
  command: z.literal('playback-server.seek'),
  params: z.object({
    sessionId: sPlaybackSessionId,
    time: z.number().int().positive().describe('Position (unix ms)'),
  }),
});

export type SeekPlaybackSessionCommand = z.infer<
  typeof sSeekPlaybackSessionCommand
>;

export type PlaybackServerCommand =
  | OpenPlaybackSessionCommand
  | ClosePlaybackSessionCommand
  | PlayPlaybackSessionCommand
  | PausePlaybackSessionCommand
  | SeekPlaybackSessionCommand;

export const playbackServerCommandSchemas = {
  'playback-server.open-session': sOpenPlaybackSessionCommand,
  'playback-server.close-session': sClosePlaybackSessionCommand,
  'playback-server.play': sPlayPlaybackSessionCommand,
  'playback-server.pause': sPausePlaybackSessionCommand,
  'playback-server.seek': sSeekPlaybackSessionCommand,
} as const;
