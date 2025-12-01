import { z } from 'zod';
import { sDeviceId, sNotificationSeverity } from '../../primitives';

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
