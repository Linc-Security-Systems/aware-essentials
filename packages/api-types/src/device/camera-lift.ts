import { z } from 'zod';

export const CAMERA_LIFT = 'camera-lift' as const;

// SPECS

export const sCameraLiftSpecs = z.object({});

export type CameraLiftSpecs = z.infer<typeof sCameraLiftSpecs>;
// COMMANDS

export interface CameraLiftRaiseCommand {
  command: 'camera-lift.raise';
  params: object;
}

export interface CameraLiftLowerCommand {
  command: 'camera-lift.lower';
  params: object;
}

export type CameraLiftCommand = CameraLiftRaiseCommand | CameraLiftLowerCommand;

// STATE

export interface CameraLiftStateDto {
  raised: boolean;
  connected: boolean;
}
