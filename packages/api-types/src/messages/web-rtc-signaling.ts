import z from 'zod';
import { WebSocketMessage } from './web-socket';

export const sSessionDescription = z.object({
  type: z.string().nonempty(),
  sdp: z.string().nonempty(),
});

export type SessionDescription = z.infer<typeof sSessionDescription>;

export const sIceCandidate = z.string().nonempty();

export type IceCandidate = z.infer<typeof sIceCandidate>;

export const sWebRtcServiceDescription = z.union([
  z.object({
    service: z.literal('live'),
    serviceParams: z.object({
      deviceId: z.string().nonempty(),
      streamId: z.string().nonempty(),
    }),
  }),
  z.object({
    service: z.literal('playback'),
    serviceParams: z.object({
      controllerId: z.string().nonempty(),
    }),
  }),
]);

export type WebRtcServiceDescription = z.infer<
  typeof sWebRtcServiceDescription
>;

export const sWebRtcNewSessionPayload = sWebRtcServiceDescription.and(
  z.object({
    from: z.string().optional(),
    requestId: z.string().nonempty(),
  }),
);

export type WebRtcNewSessionPayload = z.infer<typeof sWebRtcNewSessionPayload>;

export const sWebRtcSessionCreatedPayload = z.object({
  requestId: z.string().nonempty(),
  sessionId: z.string().nonempty(),
  stunServer: z.string().nullable(),
  frozenStreamTimeout: z.number().nullable(),
  trickleIce: z.boolean(),
});

export type WebRtcSessionCreatedPayload = z.infer<
  typeof sWebRtcSessionCreatedPayload
>;

export const sWebRtcOfferPayload = z.object({
  sessionId: z.string().nonempty(),
  description: sSessionDescription,
  from: z.string().optional(),
});

export type WebRtcOfferPayload = z.infer<typeof sWebRtcOfferPayload>;

export const sWebRtcAnswerPayload = z.object({
  sessionId: z.string().nonempty(),
  description: sSessionDescription,
  from: z.string().optional(),
});

export type WebRtcAnswerPayload = z.infer<typeof sWebRtcAnswerPayload>;

export const sWebRtcIceCandidatePayload = z.object({
  sessionId: z.string().nonempty(),
  candidate: sIceCandidate,
  from: z.string().optional(),
});

export type WebRtcIceCandidatePayload = z.infer<
  typeof sWebRtcIceCandidatePayload
>;

export const sWebRtcReleaseSessionPayload = z.object({
  sessionId: z.string().nonempty(),
  from: z.string().optional(),
});

export type WebRtcReleaseSessionPayload = z.infer<
  typeof sWebRtcReleaseSessionPayload
>;

export const sWebRtcErrorPayload = z.object({
  sessionId: z.string().nonempty(),
  error: z.object({
    code: z.string().nonempty(),
    message: z.string().nonempty(),
  }),
});

export type WebRtcErrorPayload = z.infer<typeof sWebRtcErrorPayload>;

interface WebRtcEventMap {
  'new-session': WebRtcNewSessionPayload;
  'session-created': WebRtcSessionCreatedPayload;
  offer: WebRtcOfferPayload;
  answer: WebRtcAnswerPayload;
  'ice-candidate': WebRtcIceCandidatePayload;
  'release-session': WebRtcReleaseSessionPayload;
  error: WebRtcErrorPayload;
}

const validators: { [K in keyof WebRtcEventMap]: z.ZodTypeAny } = {
  'new-session': sWebRtcNewSessionPayload,
  'session-created': sWebRtcSessionCreatedPayload,
  offer: sWebRtcOfferPayload,
  answer: sWebRtcAnswerPayload,
  'ice-candidate': sWebRtcIceCandidatePayload,
  'release-session': sWebRtcReleaseSessionPayload,
  error: sWebRtcErrorPayload,
};

export type WebRtcWsMessage = {
  [K in keyof WebRtcEventMap]: {
    event: K;
    data: WebRtcEventMap[K];
  };
}[keyof WebRtcEventMap];

// validate a web socket message as a WebRTC signaling message (use validators according to event)
export const isWebRtcWebSocketMessage = (
  message: WebSocketMessage,
): message is WebRtcWsMessage => {
  const validator = validators[message.event as keyof WebRtcEventMap];
  if (!validator) {
    return false;
  }
  return validator.safeParse(message.data).success;
};

export type WebRtcMessage = {
  [K in keyof WebRtcEventMap]: {
    type: K;
  } & WebRtcEventMap[K];
}[keyof WebRtcEventMap];
