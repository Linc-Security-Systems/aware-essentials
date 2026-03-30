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
};

export type DeviceRelationDto = z.infer<typeof sDeviceRelationDto>;

export type DeviceRelationSide = z.infer<typeof sDeviceRelationSide>;

export const sStreamRecorderSettings = z.object({
  streamId: z.string(),
  retentionHours: z.number().int().positive().optional(),
});

export const sRecordingRelationData = z.object({
  streams: z.record(z.string(), sStreamRecorderSettings),
});

export type StreamRecorderSettings = z.infer<typeof sStreamRecorderSettings>;

export type RecordingRelationData = z.infer<typeof sRecordingRelationData>;

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
};
