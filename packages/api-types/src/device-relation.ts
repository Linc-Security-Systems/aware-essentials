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
