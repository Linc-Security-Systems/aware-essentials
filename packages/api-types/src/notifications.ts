import { z } from 'zod';
import { sDeviceId, sNotificationSeverity } from './primitives';

export const sNotificationDto = z.object({
  id: z.string().nonempty(),
  source: sDeviceId.optional(),
  message: z.string().nonempty(),
  severity: sNotificationSeverity,
  metadata: z.record(z.unknown()),
  createdOn: z.number().int().nonnegative(),
  acknowledgedBy: z.string().nonempty().nullable(),
  acknowledgedOn: z.number().int().nonnegative().nullable(),
});

export type NotificationDto = z.infer<typeof sNotificationDto>;

export const sNotificationSearchParams = z.object({
  deviceId: z.array(sDeviceId).optional(),
  severity: z.array(sNotificationSeverity).optional(),
  acknowledged: z.boolean().optional(),
  timeFrom: z.number().int().nonnegative().optional(),
  timeTo: z.number().int().nonnegative().optional(),
});

export type NotificationSearchParams = z.infer<
  typeof sNotificationSearchParams
>;
