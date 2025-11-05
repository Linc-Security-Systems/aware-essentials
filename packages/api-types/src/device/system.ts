import { sNotificationSeverity } from '../primitives';
import { z } from 'zod';

export const SYSTEM = 'system' as const;

// SPECS

export const sSystemDeviceSpecs = z.object({});
export type SystemDeviceSpecs = z.infer<typeof sSystemDeviceSpecs>;

// STATE

export const sSystemDeviceStateDto = z.record(z.unknown());
export type SystemDeviceStateDto = z.infer<typeof sSystemDeviceStateDto>;

// EVENTS

export const sNotificationCreated = z.object({
  kind: z.literal('notification-created'),
  notificationRef: z.string().optional(),
  severity: sNotificationSeverity,
  message: z.string().nonempty(),
  metadata: z.record(z.unknown()).optional(),
});

export const systemDeviceEventSchemasByKind = {
  'notification-created': sNotificationCreated,
} as const;

export type NotificationCreated = z.infer<typeof sNotificationCreated>;

export type SystemDeviceEvent = NotificationCreated;
