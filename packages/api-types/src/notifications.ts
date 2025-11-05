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
