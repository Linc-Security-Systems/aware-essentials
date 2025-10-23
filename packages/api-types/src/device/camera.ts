import { sPresetId } from '../primitives';
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
  panMin: z.number().min(-1).max(1),
  panMax: z.number().min(-1).max(1),
  tiltMin: z.number().min(-1).max(1),
  tiltMax: z.number().min(-1).max(1),
  zoomMin: z.number().min(0).max(1),
  zoomMax: z.number().min(0).max(1),
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
