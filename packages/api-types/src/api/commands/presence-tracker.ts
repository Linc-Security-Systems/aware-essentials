import { sPersonId, sZoneId } from '../../primitives';
import { z } from 'zod';

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
