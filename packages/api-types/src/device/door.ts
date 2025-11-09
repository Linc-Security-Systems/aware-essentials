import { z } from 'zod';

export const DOOR = 'door' as const;

// SPECS

export const sDoorSpecs = z.object({
  canReportOpenState: z.boolean(),
  canReportLockState: z.boolean(),
  canControlLock: z.boolean(),
  canRelease: z.boolean(),
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
