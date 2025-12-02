import { z } from 'zod';

export const DOOR = 'door' as const;

// SPECS

export const sDoorSpecs = z.object({
  canReportOpenState: z.boolean(),
  canReportLockState: z.boolean(),
  canControlLock: z.boolean(),
  canRelease: z.boolean(),
  style: z
    .enum(['single', 'double', 'sliding', 'hatch', 'roller', 'window'])
    .optional(),
});

export type DoorSpecs = z.infer<typeof sDoorSpecs>;

// STATE

export interface DoorStateDto {
  locked: boolean;
  open: boolean;
  alarmMode: boolean;
  lastAlarmTimestamp: number;
  connected: boolean;
}
