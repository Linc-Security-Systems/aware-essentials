import { sCredentialType } from '../access-control';
import { z } from 'zod';

export const DOOR = 'door' as const;

// SPECS

export const sDoorSpecs = z.object({});

export type DoorSpecs = z.infer<typeof sDoorSpecs>;

// COMMANDS

export interface DoorUnlockCommand {
  command: 'door.unlock';
  params: object;
}

export interface DoorLockCommand {
  command: 'door.lock';
  params: object;
}

export interface DoorReleaseCommand {
  command: 'door.release';
  params: object;
}

export interface DoorAlarmAckCommand {
  command: 'door.alarm-ack';
  params: object;
}

export type DoorCommand =
  | DoorUnlockCommand
  | DoorLockCommand
  | DoorReleaseCommand
  | DoorAlarmAckCommand;

// STATE

export interface DoorStateDto {
  locked: boolean;
  open: boolean;
  alarmMode: boolean;
  lastAlarmTimestamp: number;
  connected: boolean;
}

// EVENTS

export const sDoorAccessEvent = z.object({
  kind: z.literal('door-access'),
  personId: z.string().optional(),
  token: z.string().nullable(),
  tokenType: sCredentialType.nullable(),
  allowed: z.boolean(),
  doorExit: z.boolean(),
  description: z.string(),
});

export const sDoorForceEvent = z.object({
  kind: z.literal('door-force'),
});
export const sDoorTamperEvent = z.object({
  kind: z.literal('door-tamper'),
});
export const sDoorLeftOpenEvent = z.object({
  kind: z.literal('door-left-open'),
});
export const sDoorRelockEvent = z.object({
  kind: z.literal('door-relock'),
});
export const sDoorMainsFailedEvent = z.object({
  kind: z.literal('door-mains-failed'),
});
export const sDoorAcuNotRespondingEvent = z.object({
  kind: z.literal('door-acu-not-responding'),
});
export const sDoorMainsRestoredEvent = z.object({
  kind: z.literal('door-mains-restored'),
});
export const sDoorAcuOnlineEvent = z.object({
  kind: z.literal('door-acu-online'),
});
export const sDoorTamperRestoredEvent = z.object({
  kind: z.literal('door-tamper-restored'),
});

export const doorEventSchemaByKind = {
  'door-access': sDoorAccessEvent,
  'door-force': sDoorForceEvent,
  'door-tamper': sDoorTamperEvent,
  'door-left-open': sDoorLeftOpenEvent,
  'door-relock': sDoorRelockEvent,
  'door-mains-failed': sDoorMainsFailedEvent,
  'door-acu-not-responding': sDoorAcuNotRespondingEvent,
  'door-mains-restored': sDoorMainsRestoredEvent,
  'door-acu-online': sDoorAcuOnlineEvent,
  'door-tamper-restored': sDoorTamperRestoredEvent,
} as const;

export type DoorAccessEvent = z.infer<typeof sDoorAccessEvent>;

export type DoorForceEvent = z.infer<typeof sDoorForceEvent>;

export type DoorTamperEvent = z.infer<typeof sDoorTamperEvent>;

export type DoorLeftOpenEvent = z.infer<typeof sDoorLeftOpenEvent>;

export type DoorRelockEvent = z.infer<typeof sDoorRelockEvent>;

export type DoorMainsFailedEvent = z.infer<typeof sDoorMainsFailedEvent>;

export type DoorAcuNotRespondingEvent = z.infer<
  typeof sDoorAcuNotRespondingEvent
>;

export type DoorMainsRestoredEvent = z.infer<typeof sDoorMainsRestoredEvent>;

export type DoorAcuOnlineEvent = z.infer<typeof sDoorAcuOnlineEvent>;

export type DoorTamperRestoredEvent = z.infer<typeof sDoorTamperRestoredEvent>;

export type DoorEvent =
  | DoorAccessEvent
  | DoorForceEvent
  | DoorTamperEvent
  | DoorLeftOpenEvent
  | DoorRelockEvent
  | DoorMainsFailedEvent
  | DoorAcuNotRespondingEvent
  | DoorMainsRestoredEvent
  | DoorAcuOnlineEvent
  | DoorTamperRestoredEvent;
