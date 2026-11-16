import { DeviceEvent } from '../events';
import { z } from 'zod';

export interface AlarmSearchQueryDto {
  deviceId?: string[];
  kind?: string[];
  userId?: string[];
  personId?: string[];
  timeFrom?: number;
  timeTo?: number;
  offset?: number;
  limit?: number;
}

export const sAlarmSearchItemDto = z.object({
  id: z.string(),
  triggeredOn: z.number(),
  acknowledgedOn: z.number().nullable(),
  acknowledgedBy: z.string().nullable(),
  triggers: z.array(
    z.object({
      id: z.string(),
      timestamp: z.number(),
      deviceId: z.string(),
      kind: z.string() as z.ZodType<DeviceEvent['kind']>,
    }),
  ),
});

export type AlarmSearchItemDto = z.infer<typeof sAlarmSearchItemDto>;
