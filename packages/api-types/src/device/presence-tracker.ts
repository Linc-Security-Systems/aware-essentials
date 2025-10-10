import { sPersonId, sZoneId } from '../primitives';
import { z } from 'zod';

export const PRESENCE_TRACKER = 'presence-tracker';

// SPECS

// STATE

export interface PresenceTrackerState {
  zonePeople: Record<string, string[]>;
}

// COMMANDS

export const sCheckInPersonCommand = z.object({
  command: z.literal('presence-tracker.check-in'),
  params: z.object({
    personId: sPersonId,
    zoneId: sZoneId.nullable(),
  }),
});

export type CheckInPerson = z.infer<typeof sCheckInPersonCommand>;

export const sCheckOutPersonCommand = z.object({
  command: z.literal('presence-tracker.check-out'),
  params: z.object({
    personId: sPersonId,
    zoneId: sZoneId.nullable(),
    leave: z.boolean(),
  }),
});

export type CheckOutPerson = z.infer<typeof sCheckOutPersonCommand>;
export const sTogglePresenceCommand = z.object({
  command: z.literal('presence-tracker.toggle-presence'),
  params: z.object({
    personId: sPersonId,
    zoneId: sZoneId.nullable(),
  }),
});

export type TogglePresence = z.infer<typeof sTogglePresenceCommand>;

export const presenceTrackerCommands = {
  'presence-tracker.check-in': sCheckInPersonCommand,
  'presence-tracker.check-out': sCheckOutPersonCommand,
  'presence-tracker.toggle-presence': sTogglePresenceCommand,
} as const;

export type PresenceTrackerCommand =
  | CheckInPerson
  | CheckOutPerson
  | TogglePresence;

// EVENTS

export const sPersonIn = z.object({
  kind: z.literal('person-in'),
  personId: sPersonId,
  personFirstName: z.string().nonempty(),
  personLastName: z.string().nonempty(),
  personAvatarId: z.string().nullable(),
  personType: z.string().nonempty(),
  personPosition: z.string().nullable(),
  zoneId: z.string().nullable(),
  securityChecked: z.boolean(),
});

export const sPersonOut = z.object({
  kind: z.literal('person-out'),
  personId: sPersonId,
  personFirstName: z.string().nonempty(),
  personLastName: z.string().nonempty(),
  personAvatarId: z.string().nullable(),
  personType: z.string().nonempty(),
  personPosition: z.string().max(128).nullable(),
  isLeave: z.boolean(),
  zoneId: z.string().nullable(),
  securityChecked: z.boolean(),
});

export const presenceTrackerEventSchemaByKind = {
  'person-in': sPersonIn,
  'person-out': sPersonOut,
} as const;

export type PersonIn = z.infer<typeof sPersonIn>;

export type PersonOut = z.infer<typeof sPersonOut>;

export type PresenceTrackerEvent = PersonIn | PersonOut;
