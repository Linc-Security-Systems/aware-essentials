import { z } from 'zod';

export const GENERIC_SENSOR = 'generic-sensor' as const;

// SPECS

export const sGenericSensorSpecs = z.object({});

export type GenericSensorSpecs = z.infer<typeof sGenericSensorSpecs>;

// STATE

export interface GenericSensorStateDto {
  isActive: boolean;
  connected: boolean;
}
