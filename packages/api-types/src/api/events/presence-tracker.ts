import { sPersonId } from '../../primitives';
import { z } from 'zod';

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
