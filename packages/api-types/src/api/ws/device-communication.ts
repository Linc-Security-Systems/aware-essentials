import z from 'zod';
import { CommandRun } from '../commands/all';
import { DeviceEvent } from '../events';
import { WebSocketMessage } from './web-socket';

export type CommandRunPayload = CommandRun;

export const sCommandSuccess = z.object({
  timestamp: z.number(),
  requestId: z.string(),
});

export type CommandSuccessPayload = z.infer<typeof sCommandSuccess>;

export const sCommandError = z.object({
  timestamp: z.number(),
  requestId: z.string(),
  error: z.object({}),
});

export type CommandErrorPayload = z.infer<typeof sCommandError>;

export const sStateUpdate = z.object({
  timestamp: z.number(),
  deviceId: z.string(),
  state: z.object({}),
});

export type StateUpdatePayload = z.infer<typeof sStateUpdate>;

export const sStateUnavailable = z.object({
  timestamp: z.number(),
  deviceId: z.string(),
});

export type StateUnavailablePayload = z.infer<typeof sStateUnavailable>;

export const sStateUpdateError = z.object({
  timestamp: z.number(),
  deviceId: z.string(),
  error: z.object({}),
});

export type StateUpdateErrorPayload = z.infer<typeof sStateUpdateError>;

export const sStateSubscribe = z.object({
  timestamp: z.number(),
  requestId: z.string(),
  deviceId: z.string(),
});

export type StateSubscribePayload = z.infer<typeof sStateSubscribe>;

export const sStateUnsubscribe = z.object({
  timestamp: z.number(),
  requestId: z.string(),
  deviceId: z.string(),
});

export type StateUnsubscribePayload = z.infer<typeof sStateUnsubscribe>;

export type DeviceEventPayload = DeviceEvent;

interface DeviceMessageMap {
  'command-run': CommandRunPayload;
  'command-success': CommandSuccessPayload;
  'command-error': CommandErrorPayload;
  'state-update': StateUpdatePayload;
  'state-unavailable': StateUnavailablePayload;
  'state-update-error': StateUpdateErrorPayload;
  'state-subscribe': StateSubscribePayload;
  'state-unsubscribe': StateUnsubscribePayload;
  'device-event': DeviceEventPayload;
}

const validators: { [K in keyof DeviceMessageMap]: z.ZodObject<any> } = {
  'command-run': z.object({}),
  'command-success': sCommandSuccess,
  'command-error': sCommandError,
  'state-update': sStateUpdate,
  'state-unavailable': sStateUnavailable,
  'state-update-error': sStateUpdateError,
  'state-subscribe': sStateSubscribe,
  'state-unsubscribe': sStateUnsubscribe,
  'device-event': z.object({}),
};

export type DeviceWsMessage = {
  [K in keyof DeviceMessageMap]: {
    event: K;
    data: DeviceMessageMap[K];
  };
}[keyof DeviceMessageMap];

export const isDeviceMessage = (
  message: WebSocketMessage,
): message is DeviceWsMessage => {
  const validator = validators[message.event as keyof DeviceMessageMap];
  if (!validator) {
    return false;
  }
  return validator.safeParse(message.data).success;
};

export const isDeviceEventMessage = (
  message: DeviceWsMessage,
): message is {
  event: 'device-event';
  data: DeviceEventPayload;
} => {
  return message.event === 'device-event';
};
