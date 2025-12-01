import { z } from 'zod';

// COMMANDS

export const sCameraLiftRaiseCommand = z.object({
  command: z.literal('camera-lift.raise'),
  params: z.object({}),
});

export type CameraLiftRaiseCommand = z.infer<typeof sCameraLiftRaiseCommand>;

export const sCameraLiftLowerCommand = z.object({
  command: z.literal('camera-lift.lower'),
  params: z.object({}),
});

export type CameraLiftLowerCommand = z.infer<typeof sCameraLiftLowerCommand>;

export type CameraLiftCommand = CameraLiftRaiseCommand | CameraLiftLowerCommand;

export const cameraLiftCommands = {
  'camera-lift.raise': sCameraLiftRaiseCommand,
  'camera-lift.lower': sCameraLiftLowerCommand,
} as const;
