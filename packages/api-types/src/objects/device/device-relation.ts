import { z } from 'zod';

export const sDeviceRelationKind = z.enum([
  'attachedTo',
  'parent',
  'child',
  'holds',
  'isHeldBy',
  'observes',
  'isObservedBy',
  'sendsInputTo',
  'receivesInputFrom',
  'sendsOutputTo',
  'receivesOutputFrom',
  'unlocks',
  'isUnlockedBy',
  'controls',
  'isControlledBy',
  'records',
  'isRecordedBy',
  'reads',
  'isReadBy',
  'isIngestedBy',
  'ingests',
]);

export const sDeviceRelationDto = z
  .object({
    leftId: z.string(),
    rightId: z.string(),
    kind: sDeviceRelationKind,
  })
  .catchall(z.unknown());

export const sDeviceRelationSide = z
  .object({
    id: z.string(),
    kind: sDeviceRelationKind,
  })
  .catchall(z.unknown());

export type DeviceRelationKind = z.infer<typeof sDeviceRelationKind>;

export const relationKinds: Record<DeviceRelationKind, DeviceRelationKind> = {
  attachedTo: 'attachedTo',
  parent: 'parent',
  child: 'child',
  holds: 'holds',
  isHeldBy: 'isHeldBy',
  observes: 'observes',
  isObservedBy: 'isObservedBy',
  sendsInputTo: 'sendsInputTo',
  receivesInputFrom: 'receivesInputFrom',
  sendsOutputTo: 'sendsOutputTo',
  receivesOutputFrom: 'receivesOutputFrom',
  unlocks: 'unlocks',
  isUnlockedBy: 'isUnlockedBy',
  controls: 'controls',
  isControlledBy: 'isControlledBy',
  records: 'records',
  isRecordedBy: 'isRecordedBy',
  reads: 'reads',
  isReadBy: 'isReadBy',
  ingests: 'ingests',
  isIngestedBy: 'isIngestedBy',
};

export const inverseRelationKinds: Record<
  DeviceRelationKind,
  DeviceRelationKind
> = {
  attachedTo: 'attachedTo',
  parent: 'child',
  child: 'parent',
  holds: 'isHeldBy',
  isHeldBy: 'holds',
  observes: 'isObservedBy',
  isObservedBy: 'observes',
  sendsInputTo: 'receivesInputFrom',
  receivesInputFrom: 'sendsInputTo',
  sendsOutputTo: 'receivesOutputFrom',
  receivesOutputFrom: 'sendsOutputTo',
  unlocks: 'isUnlockedBy',
  isUnlockedBy: 'unlocks',
  controls: 'isControlledBy',
  isControlledBy: 'controls',
  records: 'isRecordedBy',
  isRecordedBy: 'records',
  reads: 'isReadBy',
  isReadBy: 'reads',
  ingests: 'isIngestedBy',
  isIngestedBy: 'ingests',
};

export type DeviceRelationDto = z.infer<typeof sDeviceRelationDto>;

export type DeviceRelationSide = z.infer<typeof sDeviceRelationSide>;

// RECORDING RELATION DATA

export const sStreamRecorderSettings = z.object({
  retentionHours: z.number().int().positive().optional(),
  prebufferSeconds: z.number().int().nonnegative().optional(),
});

export const sRecordingRelationData = z.object({
  streams: z.record(z.string(), sStreamRecorderSettings),
});

export type StreamRecorderSettings = z.infer<typeof sStreamRecorderSettings>;

export type RecordingRelationData = z.infer<typeof sRecordingRelationData>;

// AI INFERENCE RELATION DATA

// --- motion detection module ---

export const sMotionDetectionConfiguration = z.object({
  threshold: z.number().min(0).max(1).optional(),
  enabled: z.boolean(),
  fps: z.number().int().positive().optional(),
});

export type MotionDetectionConfiguration = z.infer<
  typeof sMotionDetectionConfiguration
>;

// --- label detection module ---

export const sAiLabelConfiguration = z.object({
  threshold: z.number().min(0).max(1).optional(),
  enabled: z.boolean(),
});

export type AiLabelConfiguration = z.infer<typeof sAiLabelConfiguration>;

export const sAiDetectionConfiguration = z.object({
  labels: z.record(z.string(), sAiLabelConfiguration),
  enabled: z.boolean(),
  fps: z.number().int().positive().optional(),
});

export type AiDetectionConfiguration = z.infer<
  typeof sAiDetectionConfiguration
>;

// --- face recognition module ---

export const sAiFaceRecognitionConfiguration = z.object({
  threshold: z.number().min(0).max(1).optional(),
  enabled: z.boolean(),
  fps: z.number().int().positive().optional(),
});

export type AiFaceRecognitionConfiguration = z.infer<
  typeof sAiFaceRecognitionConfiguration
>;

// --- semantic search module ---

export const sAiSemanticSearchConfiguration = z.object({
  enabled: z.boolean(),
  fps: z.number().int().positive().optional(),
});

export type AiSemanticSearchConfiguration = z.infer<
  typeof sAiSemanticSearchConfiguration
>;

// --- stream configuration ---

export const sAiStreamConfiguration = z.object({
  motionDetection: sMotionDetectionConfiguration.optional(),
  labelDetection: sAiDetectionConfiguration.optional(),
  faceRecognition: sAiFaceRecognitionConfiguration.optional(),
  semanticSearch: sAiSemanticSearchConfiguration.optional(),
});

export const sAiCapability = z.enum([
  'motionDetection',
  'labelDetection',
  'faceRecognition',
  'semanticSearch',
]);

export type AiCapability = z.infer<typeof sAiCapability>;

export type AiStreamConfiguration = z.infer<typeof sAiStreamConfiguration>;

// all together now: AI inference relation data

export const sAiInferenceRelationData = z.object({
  streams: z.record(z.string(), sAiStreamConfiguration),
});

export type AiInferenceRelationData = z.infer<typeof sAiInferenceRelationData>;

// IO BOARD CONNECTIONS RELATION DATA

export const sIoBoardRelationData = z.object({
  slots: z.record(z.string(), z.string()),
  invertedSlots: z.array(z.string()),
});

export type IoBoardRelationData = z.infer<typeof sIoBoardRelationData>;

const sEmptyRelationData = z.object({});

/** Compile-time map: relation kind → data type. */
export interface DeviceRelationDataMap {
  records: RecordingRelationData;
  isRecordedBy: RecordingRelationData;
  sendsInputTo: IoBoardRelationData;
  receivesInputFrom: IoBoardRelationData;
  sendsOutputTo: IoBoardRelationData;
  receivesOutputFrom: IoBoardRelationData;
  attachedTo: Record<string, never>;
  parent: Record<string, never>;
  child: Record<string, never>;
  holds: Record<string, never>;
  isHeldBy: Record<string, never>;
  observes: Record<string, never>;
  isObservedBy: Record<string, never>;
  unlocks: Record<string, never>;
  isUnlockedBy: Record<string, never>;
  controls: Record<string, never>;
  isControlledBy: Record<string, never>;
  reads: Record<string, never>;
  isReadBy: Record<string, never>;
  ingests: AiInferenceRelationData;
  isIngestedBy: AiInferenceRelationData;
}

/** Runtime map: relation kind → Zod schema for its data. */
export const sDeviceRelationDataMap: {
  [K in DeviceRelationKind]: z.ZodType<DeviceRelationDataMap[K]>;
} = {
  records: sRecordingRelationData,
  isRecordedBy: sRecordingRelationData,
  sendsInputTo: sIoBoardRelationData,
  receivesInputFrom: sIoBoardRelationData,
  sendsOutputTo: sIoBoardRelationData,
  receivesOutputFrom: sIoBoardRelationData,
  attachedTo: sEmptyRelationData,
  parent: sEmptyRelationData,
  child: sEmptyRelationData,
  holds: sEmptyRelationData,
  isHeldBy: sEmptyRelationData,
  observes: sEmptyRelationData,
  isObservedBy: sEmptyRelationData,
  unlocks: sEmptyRelationData,
  isUnlockedBy: sEmptyRelationData,
  controls: sEmptyRelationData,
  isControlledBy: sEmptyRelationData,
  reads: sEmptyRelationData,
  isReadBy: sEmptyRelationData,
  ingests: sAiInferenceRelationData,
  isIngestedBy: sAiInferenceRelationData,
};
