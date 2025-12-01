import z from 'zod';
import { WebSocketMessage } from './web-socket';
import { sNotificationDto } from '../../objects';

export const sNotificationCreatedPayload = sNotificationDto;

export type NotificationCreatedPayload = z.infer<
  typeof sNotificationCreatedPayload
>;

export const sNotificationAcknowledgedPayload = z.object({
  id: z.string().nonempty(),
  acknowledgedBy: z.string().nonempty(),
  acknowledgedOn: z.number().int().nonnegative(),
});

export type NotificationAcknowledgedPayload = z.infer<
  typeof sNotificationAcknowledgedPayload
>;

interface NotificationEventMap {
  new: NotificationCreatedPayload;
  ack: NotificationAcknowledgedPayload;
}

const validators: { [K in keyof NotificationEventMap]: z.ZodTypeAny } = {
  new: sNotificationCreatedPayload,
  ack: sNotificationAcknowledgedPayload,
};

export type NotificationWsMessage = {
  [K in keyof NotificationEventMap]: {
    event: K;
    data: NotificationEventMap[K];
  };
}[keyof NotificationEventMap];

// validate a web socket message as a Notification message (use validators according to event)
export const isNotificationWebSocketMessage = (
  message: WebSocketMessage,
): message is NotificationWsMessage => {
  const validator = validators[message.event as keyof NotificationEventMap];
  if (!validator) {
    return false;
  }
  return validator.safeParse(message.data).success;
};

export type NotificationMessage = {
  [K in keyof NotificationEventMap]: {
    type: K;
  } & NotificationEventMap[K];
}[keyof NotificationEventMap];
