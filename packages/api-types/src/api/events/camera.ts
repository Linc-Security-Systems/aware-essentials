import { sCameraPresetInfo, sWorldObjectId } from '../../primitives';
import { z } from 'zod';

// EVENTS

export const sCameraPtzPresetSaved = z.object({
  kind: z.literal('ptz-preset-saved'),
  presetId: z.string().nonempty(),
  presetInfo: sCameraPresetInfo,
  assignedRef: z.string().nullable(),
});

/** A box in the picture the object was detected in, in pixels of that picture. */
export const sBoxLocator = z.object({
  locatorKind: z.literal('box'),
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
  frameWidth: z
    .number()
    .positive()
    .optional()
    .describe(
      'Width in pixels of the picture the box is measured in, which is not necessarily the stream resolution',
    ),
  frameHeight: z
    .number()
    .positive()
    .optional()
    .describe('Height in pixels of the picture the box is measured in'),
});

export const sObjectLocator = sBoxLocator;

export const sObjectDetectionData = z
  .object({
    objectKind: sWorldObjectId.nullable(),
    probability: z.number(),
    identifiedObjectId: z
      .string()
      .nullable()
      .describe(
        'Who or what the object was identified as. For faces, the Aware person id.',
      ),
    identificationScore: z
      .number()
      .nullable()
      .optional()
      .describe('Confidence of identifiedObjectId, 0 to 1, when known'),
    providerZones: z
      .array(z.string())
      .optional()
      .describe(
        "Names of the detection provider's zones the object is in now. These are the vendor's zones, not Aware Zones.",
      ),
    stationary: z
      .boolean()
      .optional()
      .describe('Whether the object has stopped moving'),
    frameTime: z.number(),
    startTime: z.number(),
    endTime: z.number().nullable(),
  })
  .and(sObjectLocator);

const sProviderAssignedRef = z
  .string()
  .nonempty()
  .describe(
    'Correlates the events of one detected object, from started to ended; unique only with the provider and camera',
  );

/**
 * A detected object's events: started once, then any number of updated, then ended once.
 */
export const sObjectDetectionStarted = z
  .object({
    kind: z.literal('object-detection-started'),
    providerAssignedRef: sProviderAssignedRef,
    detectionProvider: z.string().nonempty(),
  })
  .and(sObjectDetectionData);

export const sObjectDetectionUpdated = z
  .object({
    kind: z.literal('object-detection-updated'),
    providerAssignedRef: sProviderAssignedRef,
    detectionProvider: z.string().nonempty(),
  })
  .and(sObjectDetectionData);

export const sObjectDetectionEnded = z
  .object({
    kind: z.literal('object-detection-ended'),
    providerAssignedRef: sProviderAssignedRef,
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
