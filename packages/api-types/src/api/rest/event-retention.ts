import { z } from 'zod';

export const EVENT_RETENTION_MIN_DAYS = 1;
export const EVENT_RETENTION_MAX_DAYS = 3650;

export const sEventRetention = z.object({
  /** Events older than this many days are permanently deleted. */
  retentionDays: z
    .number()
    .int()
    .min(EVENT_RETENTION_MIN_DAYS)
    .max(EVENT_RETENTION_MAX_DAYS),
});

export type EventRetention = z.infer<typeof sEventRetention>;
