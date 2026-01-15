import { sCredentialType } from '../../objects/credential';
import { z } from 'zod';
import { sPersonId } from '../../primitives';

// EVENTS

export const sDoorAccessEvent = z.object({
  kind: z.literal('door-access'),
  personId: sPersonId.optional(),
  token: z.string().nullable(),
  tokenType: sCredentialType.nullable(),
  allowed: z.boolean(),
  doorExit: z.boolean(),
  description: z.string(),
});

export const sDoorOpened = z.object({
  kind: z.literal('door-opened'),
});

export const sDoorClosed = z.object({
  kind: z.literal('door-closed'),
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
  'door-opened': sDoorOpened,
  'door-closed': sDoorClosed,
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

export type DoorOpenedEvent = z.infer<typeof sDoorOpened>;

export type DoorClosedEvent = z.infer<typeof sDoorClosed>;

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
  | DoorOpenedEvent
  | DoorClosedEvent
  | DoorForceEvent
  | DoorTamperEvent
  | DoorLeftOpenEvent
  | DoorRelockEvent
  | DoorMainsFailedEvent
  | DoorAcuNotRespondingEvent
  | DoorMainsRestoredEvent
  | DoorAcuOnlineEvent
  | DoorTamperRestoredEvent;
