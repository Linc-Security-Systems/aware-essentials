import { z } from 'zod';

export const sPersonPresenceQuery = z.object({
  persons: z.array(z.string().nonempty()),
  zones: z.array(z.string().nonempty()),
  online: z.boolean(),
});

export type PersonPresenceQuery = z.infer<typeof sPersonPresenceQuery>;

export const sPersonTogglePresence = z.union([
  z.object({
    personId: z.string(),
    zoneId: z.string(),
    credentialToken: z.undefined(),
  }),
  z.object({
    credentialToken: z.string(),
    zoneId: z.string(),
    personId: z.undefined(),
  }),
]);

export const sPersonCheckIn = z.object({
  personId: z.string(),
  zoneId: z.string(),
  checkCompleted: z.boolean().optional(),
});

export const sPersonCheckOut = z.object({
  personId: z.string(),
  zoneId: z.string(),
  leave: z.boolean().nullable(),
  checkCompleted: z.boolean().optional(),
});

export type PresenceToggleRequest = z.infer<typeof sPersonTogglePresence>;

export type PresenceCheckInRequest = z.infer<typeof sPersonCheckIn>;

export type PresenceCheckOutRequest = z.infer<typeof sPersonCheckOut>;
