import { z } from 'zod';

export const sPresencePersonDto = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  avatarId: z.string().nullable(),
  type: z.string().min(1).max(16),
  position: z.string().max(128).nullable(),
});

export type PresencePersonDto = z.infer<typeof sPresencePersonDto>;

export const sPresenceZoneDto = z.object({
  id: z.string(),
  displayName: z.string(),
  isGlobal: z
    .boolean()
    .describe('Whether the zone is the designated global zone'),
});

export type PresenceZoneDto = z.infer<typeof sPresenceZoneDto>;

export const sPersonPresenceDto = z.object({
  id: z.string(),
  person: sPresencePersonDto,
  zone: z.union([sPresenceZoneDto, z.string()]),
  online: z.boolean().nullable(),
  onLeave: z.boolean(),
  archived: z.boolean(),
  lastCheckInOn: z.number().nullable(),
  lastCheckOutOn: z.number().nullable(),
  securityChecked: z.boolean(),
});

export type PersonPresenceDto = z.infer<typeof sPersonPresenceDto>;

export const sPersonPresenceActionDto = z.object({
  id: z.string(),
  person: z.union([sPresencePersonDto, z.string()]),
  zone: z.union([sPresenceZoneDto, z.string()]),
  timestamp: z.number(),
  checkInOrOut: z.boolean(),
  isLeave: z.boolean(),
  checkCompleted: z.boolean(),
});

export type PersonPresenceActionDto = z.infer<typeof sPersonPresenceActionDto>;
