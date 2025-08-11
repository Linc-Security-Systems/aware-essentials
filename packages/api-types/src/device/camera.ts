import { z } from 'zod';

export const CAMERA = 'camera' as const;

// SPECS

export const sWebRtcPlaybackSource = z
  .object({
    kind: z.string(),
  })
  .and(z.record(z.unknown()));

export const sStreamInfo = z.object({
  id: z.string().nonempty(),
  displayName: z.string().nonempty(),
  externalPlayerUrl: z.string().nullable(),
});

export const sCameraSpecs = z.object({
  lensType: z.enum(['flat', 'fisheye']),
  mountPoint: z.enum(['wall', 'ceiling', 'floor']),
  ptzCapable: z.boolean(),
  ptzPanSpeed: z.number(),
  ptzTiltSpeed: z.number(),
  ptzZoomSpeed: z.number(),
  recordingCapable: z.boolean(),
  webrtcPlaybackSource: sWebRtcPlaybackSource.nullable(),
  streams: z.array(sStreamInfo),
  defaultStreamId: z.string().nonempty(),
});

export type WebRtcPlaybackSource = z.infer<typeof sWebRtcPlaybackSource>;

export type CameraSpecs = z.infer<typeof sCameraSpecs>;

export const isPtzParams = (
  params: any,
): params is { pan: number; tilt: number; zoom: number } =>
  typeof params.pan === 'number' &&
  typeof params.tilt === 'number' &&
  typeof params.zoom === 'number';

// COMMANDS

export const sCameraPresetInfo = z.object({
  name: z.string().nonempty(),
  isDefault: z.boolean(),
  values: z.unknown(),
});

export type CameraPresetInfo = z.infer<typeof sCameraPresetInfo>;

export interface CameraPresetSaveCommand {
  command: 'camera.preset-save';
  params: {
    presetId: string;
    presetInfo: CameraPresetInfo;
  };
}

export interface CameraPresetActivateCommand {
  command: 'camera.preset-activate';
  params: {
    presetId: string;
  };
}

export interface CameraPresetDeleteCommand {
  command: 'camera.preset-delete';
  params: {
    presetId: string;
    assignedRef: string | null;
  };
}

export interface CameraPtzSetCommand {
  command: 'camera.ptz-set';
  params: {
    pan: number;
    tilt: number;
    zoom: number;
  };
}

export interface CameraPtzMoveCommand {
  command: 'camera.ptz-move';
  params: {
    direction:
      | 'Up'
      | 'Down'
      | 'Left'
      | 'Right'
      | 'ZoomIn'
      | 'ZoomOut'
      | 'UpLeft'
      | 'UpRight'
      | 'DownLeft'
      | 'DownRight';
  };
}

export interface CameraPtzBeginMoveCommand {
  command: 'camera.ptz-begin-move';
  params: {
    pan: number;
    tilt: number;
    zoom: number;
  };
}

export interface CameraPtzEndMoveCommand {
  command: 'camera.ptz-end-move';
  params: object;
}

export interface CameraEnableCommand {
  command: 'camera.enable';
  params: object;
}

export interface CameraDisableCommand {
  command: 'camera.disable';
  params: object;
}

export interface CameraEnableDetectionCommand {
  command: 'camera.enable-detection';
  params: object;
}

export interface CameraDisableDetectionCommand {
  command: 'camera.disable-detection';
  params: object;
}

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

// STATE

export interface CameraStateDto {
  pan: number;
  tilt: number;
  zoom: number;
  enabled: boolean;
  objectDetectionEnabled: boolean;
  connected: boolean;
}

// EVENTS

export const sCameraPtzPresetSaved = z.object({
  kind: z.literal('ptz-preset-saved'),
  presetId: z.string().nonempty(),
  presetInfo: sCameraPresetInfo,
  assignedRef: z.string().nullable(),
});

export const sBoxLocator = z.object({
  locatorKind: z.literal('box'),
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
});

export const sObjectLocator = sBoxLocator;

export const sObjectDetectionData = z
  .object({
    objectKind: z.string().nullable(),
    probability: z.number(),
    identifiedObjectId: z.string().nullable(),
    frameTime: z.number(),
    startTime: z.number(),
    endTime: z.number().nullable(),
  })
  .and(sObjectLocator);

export const sObjectDetectionStarted = z
  .object({
    kind: z.literal('object-detection-started'),
    providerAssignedRef: z.string().nonempty(),
    detectionProvider: z.string().nonempty(),
  })
  .and(sObjectDetectionData);

export const sObjectDetectionUpdated = z
  .object({
    kind: z.literal('object-detection-updated'),
    providerAssignedRef: z.string().nonempty(),
    detectionProvider: z.string().nonempty(),
  })
  .and(sObjectDetectionData);

export const sObjectDetectionEnded = z
  .object({
    kind: z.literal('object-detection-ended'),
    providerAssignedRef: z.string().nonempty(),
    detectionProvider: z.string().nonempty(),
  })
  .and(sObjectDetectionData);

export const sSceneData = z.object({
  detections: z.array(z.string()),
  clipUrl: z.string().optional(),
  startTime: z.number(),
  endTime: z.number().nullable(),
});
export const sSceneCreated = z
  .object({
    kind: z.literal('scene-created'),
    providerAssignedRef: z.string().nonempty(),
    detectionProvider: z.string().nonempty(),
  })
  .and(sSceneData);

export const sSceneUpdated = z
  .object({
    kind: z.literal('scene-updated'),
    providerAssignedRef: z.string().nonempty(),
    detectionProvider: z.string().nonempty(),
  })
  .and(sSceneData);

export const sSceneEnded = z
  .object({
    kind: z.literal('scene-ended'),
    providerAssignedRef: z.string().nonempty(),
    detectionProvider: z.string().nonempty(),
  })
  .and(sSceneData);

export const cameraEventSchemasByKind = {
  'ptz-preset-saved': sCameraPtzPresetSaved,
  'object-detection-started': sObjectDetectionStarted,
  'object-detection-updated': sObjectDetectionUpdated,
  'object-detection-ended': sObjectDetectionEnded,
  'scene-created': sSceneCreated,
  'scene-updated': sSceneUpdated,
  'scene-ended': sSceneEnded,
} as const;

export type CameraPtzPresetSaved = z.infer<typeof sCameraPtzPresetSaved>;

export type BoxLocator = z.infer<typeof sBoxLocator>;

export type ObjectLocator = z.infer<typeof sObjectLocator>;

export type ObjectDetectionData = z.infer<typeof sObjectDetectionData>;

export type ObjectDetectionStarted = z.infer<typeof sObjectDetectionStarted>;

export type ObjectDetectionUpdated = z.infer<typeof sObjectDetectionUpdated>;

export type ObjectDetectionEnded = z.infer<typeof sObjectDetectionEnded>;

export type SceneData = z.infer<typeof sSceneData>;

export type SceneCreated = z.infer<typeof sSceneCreated>;

export type SceneUpdated = z.infer<typeof sSceneUpdated>;

export type SceneEnded = z.infer<typeof sSceneEnded>;

export type CameraEvent =
  | CameraPtzPresetSaved
  | ObjectDetectionStarted
  | ObjectDetectionUpdated
  | ObjectDetectionEnded
  | SceneCreated
  | SceneUpdated
  | SceneEnded;
