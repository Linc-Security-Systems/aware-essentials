import { sCameraPresetInfo, sPresetId } from '../../primitives';
import { z } from 'zod';

export const isPtzParams = (
  params: any,
): params is { pan: number; tilt: number; zoom: number } =>
  typeof params.pan === 'number' &&
  typeof params.tilt === 'number' &&
  typeof params.zoom === 'number';

// COMMANDS

export const sCameraPresetSaveCommand = z.object({
  command: z.literal('camera.preset-save'),
  params: z.object({
    presetId: sPresetId,
    presetInfo: sCameraPresetInfo,
  }),
});

export type CameraPresetSaveCommand = z.infer<typeof sCameraPresetSaveCommand>;

export const sCameraPresetActivateCommand = z.object({
  command: z.literal('camera.preset-activate'),
  params: z.object({
    presetId: sPresetId,
  }),
});

export type CameraPresetActivateCommand = z.infer<
  typeof sCameraPresetActivateCommand
>;

export const sCameraPresetDeleteCommand = z.object({
  command: z.literal('camera.preset-delete'),
  params: z.object({
    presetId: sPresetId,
    assignedRef: z.string().nullable(),
  }),
});

export type CameraPresetDeleteCommand = z.infer<
  typeof sCameraPresetDeleteCommand
>;

export const sCameraPtzSetCommand = z.object({
  command: z.literal('camera.ptz-set'),
  params: z.object({
    pan: z.number(),
    tilt: z.number(),
    zoom: z.number(),
  }),
});

export type CameraPtzSetCommand = z.infer<typeof sCameraPtzSetCommand>;

export const sPtzDirection = z.enum([
  'Up',
  'Down',
  'Left',
  'Right',
  'ZoomIn',
  'ZoomOut',
  'UpLeft',
  'UpRight',
  'DownLeft',
  'DownRight',
]);

export type PtzDirection = z.infer<typeof sPtzDirection>;

export const sCameraPtzMoveCommand = z.object({
  command: z.literal('camera.ptz-move'),
  params: z.object({
    direction: sPtzDirection,
  }),
});

export type CameraPtzMoveCommand = z.infer<typeof sCameraPtzMoveCommand>;

export const sCameraPtzBeginMoveCommand = z.object({
  command: z.literal('camera.ptz-begin-move'),
  params: z.object({
    pan: z.number(),
    tilt: z.number(),
    zoom: z.number(),
  }),
});

export type CameraPtzBeginMoveCommand = z.infer<
  typeof sCameraPtzBeginMoveCommand
>;

export const sCameraPtzEndMoveCommand = z.object({
  command: z.literal('camera.ptz-end-move'),
  params: z.object({}),
});

export type CameraPtzEndMoveCommand = z.infer<typeof sCameraPtzEndMoveCommand>;

export const sCameraEnableCommand = z.object({
  command: z.literal('camera.enable'),
  params: z.object({}),
});

export type CameraEnableCommand = z.infer<typeof sCameraEnableCommand>;

export const sCameraDisableCommand = z.object({
  command: z.literal('camera.disable'),
  params: z.object({}),
});

export type CameraDisableCommand = z.infer<typeof sCameraDisableCommand>;

export const sCameraEnableDetectionCommand = z.object({
  command: z.literal('camera.enable-detection'),
  params: z.object({}),
});

export type CameraEnableDetectionCommand = z.infer<
  typeof sCameraEnableDetectionCommand
>;

export const sCameraDisableDetectionCommand = z.object({
  command: z.literal('camera.disable-detection'),
  params: z.object({}),
});

export type CameraDisableDetectionCommand = z.infer<
  typeof sCameraDisableDetectionCommand
>;

export const cameraCommands = {
  'camera.ptz-set': sCameraPtzSetCommand,
  'camera.ptz-move': sCameraPtzMoveCommand,
  'camera.enable': sCameraEnableCommand,
  'camera.disable': sCameraDisableCommand,
  'camera.preset-save': sCameraPresetSaveCommand,
  'camera.preset-activate': sCameraPresetActivateCommand,
  'camera.preset-delete': sCameraPresetDeleteCommand,
  'camera.ptz-begin-move': sCameraPtzBeginMoveCommand,
  'camera.ptz-end-move': sCameraPtzEndMoveCommand,
  'camera.enable-detection': sCameraEnableDetectionCommand,
  'camera.disable-detection': sCameraDisableDetectionCommand,
} as const;

export type CameraCommand =
  | CameraPtzSetCommand
  | CameraPtzMoveCommand
  | CameraEnableCommand
  | CameraDisableCommand
  | CameraPresetSaveCommand
  | CameraPresetActivateCommand
  | CameraPresetDeleteCommand
  | CameraPtzBeginMoveCommand
  | CameraPtzEndMoveCommand
  | CameraEnableDetectionCommand
  | CameraDisableDetectionCommand;
