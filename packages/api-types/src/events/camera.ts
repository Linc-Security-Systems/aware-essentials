import { sCameraPresetInfo } from '../primitives';
import { z } from 'zod';

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
