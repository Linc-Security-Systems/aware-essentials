import { z } from 'zod';

export const CAMERA_LIFT = 'camera-lift' as const;

// SPECS

export const sCameraLiftSpecs = z.object({});

export type CameraLiftSpecs = z.infer<typeof sCameraLiftSpecs>;

// STATE

export interface CameraLiftStateDto {
  raised: boolean;
  connected: boolean;
}
