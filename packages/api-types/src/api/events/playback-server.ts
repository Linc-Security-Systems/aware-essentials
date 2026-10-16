import { z } from 'zod';

// EVENTS

export const sPlaybackSessionOpened = z.object({
  kind: z.literal('playback-session-opened'),
  sessionId: z.string().nonempty(),
});

export type PlaybackSessionOpened = z.infer<typeof sPlaybackSessionOpened>;

export const sPlaybackSessionClosed = z.object({
  kind: z.literal('playback-session-closed'),
  sessionId: z.string().nonempty(),
  reason: z
    .string()
    .optional()
    .describe(
      '"closed" when closed by a command, "ended" when the session ended by itself',
    ),
});

export type PlaybackSessionClosed = z.infer<typeof sPlaybackSessionClosed>;

// Records who was given a viewer link to which session. Never carries the link.
export const sPlaybackSessionLinkIssued = z.object({
  kind: z.literal('playback-session-link-issued'),
  sessionId: z.string().nonempty(),
  userId: z.string(),
});

export type PlaybackSessionLinkIssued = z.infer<
  typeof sPlaybackSessionLinkIssued
>;

export type PlaybackServerEvent =
  | PlaybackSessionOpened
  | PlaybackSessionClosed
  | PlaybackSessionLinkIssued;

export const playbackServerEventSchemasByKind = {
  'playback-session-opened': sPlaybackSessionOpened,
  'playback-session-closed': sPlaybackSessionClosed,
  'playback-session-link-issued': sPlaybackSessionLinkIssued,
} as const;
