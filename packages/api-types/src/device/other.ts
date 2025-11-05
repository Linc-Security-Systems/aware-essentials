import { sNotificationSeverity } from '../primitives';
import { z } from 'zod';

export const DEVICE_OTHER = 'device-other' as const;

// SPECS

export const sDeviceOtherSpecs = z.object({});
export type DeviceOtherSpecs = z.infer<typeof sDeviceOtherSpecs>;

// STATE

export const sDeviceOtherStateDto = z.record(z.unknown());
export type DeviceOtherStateDto = z.infer<typeof sDeviceOtherStateDto>;

// EVENTS

export const sNotificationCreated = z.object({
  kind: z.literal('notification-created'),
  notificationRef: z.string().optional(),
  severity: sNotificationSeverity,
  message: z.string().nonempty(),
  metadata: z.record(z.unknown()).optional(),
});

export const deviceOtherEventSchemasByKind = {
  'notification-created': sNotificationCreated,
} as const;

export type NotificationCreated = z.infer<typeof sNotificationCreated>;

export type DeviceOtherEvent = NotificationCreated;
