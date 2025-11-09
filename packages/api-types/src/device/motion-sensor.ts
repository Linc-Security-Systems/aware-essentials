import { z } from 'zod';

export const MOTION_SENSOR = 'motion-sensor' as const;

// SPECS

export const sMotionSensorSpecs = z.object({});

export type MotionSensorSpecs = z.infer<typeof sMotionSensorSpecs>;

// STATE

export interface MotionSensorStateDto {
  isMotionDetected: boolean;
  connected: boolean;
}
