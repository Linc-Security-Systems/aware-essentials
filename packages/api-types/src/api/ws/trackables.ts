import { z } from 'zod';
import { sWorldObjectId } from '../../primitives';
import { WebSocketMessage } from './web-socket';

export const sTrackableUpdate = z.object({
  timestamp: z.number(),
  objectId: z.string().nonempty(),
  objectName: z.string().nonempty(),
  objectKind: sWorldObjectId.nullable(),
  metadata: z.record(z.string(), z.unknown()),
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
  altitude: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
});

export type TrackableUpdate = z.infer<typeof sTrackableUpdate>;

export const sTrackableUpdatePayload = z.object({
  updates: z.record(z.string(), sTrackableUpdate),
});

export type TrackableUpdatePayload = z.infer<typeof sTrackableUpdatePayload>;

interface TrackableMessageMap {
  update: TrackableUpdatePayload;
}

const validators: { [K in keyof TrackableMessageMap]: z.ZodObject<any> } = {
  update: sTrackableUpdatePayload,
};

export type TrackableWsMessage = {
  [K in keyof TrackableMessageMap]: {
    event: K;
    data: TrackableMessageMap[K];
  };
}[keyof TrackableMessageMap];

export const isTrackableMessage = (
  message: WebSocketMessage,
): message is TrackableWsMessage => {
  const validator = validators[message.event as keyof TrackableMessageMap];
  if (!validator) {
    return false;
  }
  return validator.safeParse(message.data).success;
};
