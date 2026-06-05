import { z } from 'zod';

export const sPresencePersonDto = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  avatarId: z.string().nullable(),
  type: z.string().min(1).max(16),
  position: z.string().max(128).nullable(),
  archived: z.boolean(),
});

export type PresencePersonDto = z.infer<typeof sPresencePersonDto>;

export const sPersonPresenceDto = z.object({
  id: z.string(),
  person: sPresencePersonDto,
  checkedInZoneId: z.string().nullable(),
  onLeave: z.boolean(),
  lastCheckInOn: z.number().nullable(),
  lastCheckOutOn: z.number().nullable(),
  securityChecked: z.boolean(),
});

export type PersonPresenceDto = z.infer<typeof sPersonPresenceDto>;

export const sPersonPresenceActionDto = z.object({
  id: z.string(),
  person: z.string(),
  zone: z.string(),
  timestamp: z.number(),
  checkInOrOut: z.boolean(),
  isLeave: z.boolean(),
  checkCompleted: z.boolean(),
});

export type PersonPresenceActionDto = z.infer<typeof sPersonPresenceActionDto>;
