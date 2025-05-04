import { z } from 'zod';

export const PRESENCE_TRACKER = 'presence-tracker';

// SPECS

// STATE

export interface PresenceTrackerState {
  zonePeople: Record<string, string[]>;
}

// COMMANDS

export interface CheckInPerson {
  command: 'presence-tracker.check-in';
  params: {
    personId: string;
    zoneId: string | null;
  };
}

export interface CheckOutPerson {
  command: 'presence-tracker.check-out';
  params: {
    personId: string;
    zoneId: string | null;
    leave: boolean;
  };
}

export interface TogglePresence {
  command: 'presence-tracker.toggle-presence';
  params: {
    personId: string;
    zoneId: string | null;
  };
}

export type PresenceTrackerCommand =
  | CheckInPerson
  | CheckOutPerson
  | TogglePresence;

// EVENTS

export const sPersonIn = z.object({
  kind: z.literal('person-in'),
  personId: z.string().nonempty(),
  personFirstName: z.string().nonempty(),
  personLastName: z.string().nonempty(),
  personAvatarId: z.string().nullable(),
  zoneId: z.string().nullable(),
});

export const sPersonOut = z.object({
  kind: z.literal('person-out'),
  personId: z.string().nonempty(),
  personFirstName: z.string().nonempty(),
  personLastName: z.string().nonempty(),
  personAvatarId: z.string().nullable(),
  isLeave: z.boolean(),
  zoneId: z.string().nullable(),
});

export const presenceTrackerEventSchemaByKind = {
  'person-in': sPersonIn,
  'person-out': sPersonOut,
} as const;

export type PersonIn = z.infer<typeof sPersonIn>;

export type PersonOut = z.infer<typeof sPersonOut>;

export type PresenceTrackerEvent = PersonIn | PersonOut;
