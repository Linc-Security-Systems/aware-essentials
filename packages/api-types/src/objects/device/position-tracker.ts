import { z } from 'zod';

export const POSITION_TRACKER = 'position-tracker' as const;

// SPECS

export const sPositionTrackerSpecs = z.object({});

export type PositionTrackerSpecs = z.infer<typeof sPositionTrackerSpecs>;

// STATE

export type PositionTrackerStateDto = {
  connected: boolean;
};
