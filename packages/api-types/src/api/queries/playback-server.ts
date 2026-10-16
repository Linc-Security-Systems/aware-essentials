import { z } from 'zod';

// QUERIES

// -- Get Playback Sessions

export const QUERY_GET_PLAYBACK_SESSIONS = 'cctv:get-playback-sessions';

export const sGetPlaybackSessionsArgs = z.object({});

export const sPlaybackSessionCameraRef = z.object({
  cameraId: z.string().nonempty(),
  streamId: z.string().nonempty(),
});

export const sPlaybackSessionItem = z.object({
  sessionId: z.string().nonempty(),
  cameras: z.array(sPlaybackSessionCameraRef),
});

export const sGetPlaybackSessionsResponse = z.array(sPlaybackSessionItem);

export type GetPlaybackSessionsArgs = z.infer<typeof sGetPlaybackSessionsArgs>;

export type PlaybackSessionCameraRef = z.infer<
  typeof sPlaybackSessionCameraRef
>;

export type PlaybackSessionItem = z.infer<typeof sPlaybackSessionItem>;

export type GetPlaybackSessionsResponse = z.infer<
  typeof sGetPlaybackSessionsResponse
>;

// -- Get Playback Session Link

export const QUERY_GET_PLAYBACK_SESSION_LINK = 'cctv:get-playback-session-link';

export const sGetPlaybackSessionLinkArgs = z.object({
  sessionId: z.string().nonempty(),
});

export const sGetPlaybackSessionLinkResponse = z.object({
  baseUrl: z
    .string()
    .describe(
      'Base URL of the playback server as browsers reach it; may be a path on the current origin',
    ),
  link: z
    .string()
    .nonempty()
    .describe(
      "The viewer link's secret. A credential: send it only in a request header or the control socket's hello, never in a URL",
    ),
  cameras: z.array(
    sPlaybackSessionCameraRef.extend({
      source: z
        .string()
        .nonempty()
        .describe("The camera's source name on the playback server"),
    }),
  ),
});

export type GetPlaybackSessionLinkArgs = z.infer<
  typeof sGetPlaybackSessionLinkArgs
>;

export type GetPlaybackSessionLinkResponse = z.infer<
  typeof sGetPlaybackSessionLinkResponse
>;

// Dictionary of request schemas by query type
export const playbackServerRequestSchemas = {
  [QUERY_GET_PLAYBACK_SESSIONS]: sGetPlaybackSessionsArgs,
  [QUERY_GET_PLAYBACK_SESSION_LINK]: sGetPlaybackSessionLinkArgs,
} as const;

// Dictionary of response schemas by query type
export const playbackServerResponseSchemas = {
  [QUERY_GET_PLAYBACK_SESSIONS]: sGetPlaybackSessionsResponse,
  [QUERY_GET_PLAYBACK_SESSION_LINK]: sGetPlaybackSessionLinkResponse,
} as const;

// TypeScript mapping types for requests and responses
export type PlaybackServerQueryRequestMap = {
  [QUERY_GET_PLAYBACK_SESSIONS]: GetPlaybackSessionsArgs;
  [QUERY_GET_PLAYBACK_SESSION_LINK]: GetPlaybackSessionLinkArgs;
};

export type PlaybackServerQueryResponseMap = {
  [QUERY_GET_PLAYBACK_SESSIONS]: GetPlaybackSessionsResponse;
  [QUERY_GET_PLAYBACK_SESSION_LINK]: GetPlaybackSessionLinkResponse;
};
