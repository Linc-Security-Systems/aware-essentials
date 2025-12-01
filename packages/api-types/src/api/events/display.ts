import { z } from 'zod';

// EVENTS

export const sDisplayUnitOfflineEvent = z.object({
  kind: z.literal('display-unit-offline'),
});

export type DisplayUnitOfflineEvent = z.infer<typeof sDisplayUnitOfflineEvent>;

//Could report on other events in the future like bad streams, high cpu usage, etc.
