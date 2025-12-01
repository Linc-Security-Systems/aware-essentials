import { sDeviceId, sNotificationSeverity } from '../primitives';
import { z } from 'zod';

export const sNotificationDto = z.object({
  id: z.string().nonempty(),
  source: sDeviceId,
  message: z.string().nonempty(),
  severity: sNotificationSeverity,
  metadata: z.record(z.unknown()),
  notificationRef: z.string().nonempty().nullable(),
  createdOn: z.number().int().nonnegative(),
  acknowledgedBy: z.string().nonempty().nullable(),
  acknowledgedOn: z.number().int().nonnegative().nullable(),
});

export type NotificationDto = z.infer<typeof sNotificationDto>;
