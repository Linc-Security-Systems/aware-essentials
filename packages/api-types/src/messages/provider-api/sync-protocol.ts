import { DeviceDto } from '../../device';
import { PersonDto, ScheduleDto, ZoneDto } from '../../access-control';
import { ObjectKinds } from '../../objects';

export type SyncContext = {
  objectVersion: number;
  objectKind: keyof AccessObjects;
  objectId: string;
  originator: string;
};

export type AccessObjects = {
  person: PersonDto;
  device: DeviceDto;
  schedule: ScheduleDto;
  zone: ZoneDto;
};

export type MappedReference = {
  kind: keyof ObjectKinds;
  localId: string;
  remoteId: string;
  provider: string;
};

export interface SyncActionComplete {
  kind: 'sync-action-complete';
  provider: string;
  actionId: string;
  refs: MappedReference[];
}

export interface SyncActionFailed {
  kind: 'sync-action-failed';
  provider: string;
  actionId: string;
  code?: string;
  errorMessage: string;
}

export type SyncMergeObject = {
  [K in keyof AccessObjects]: {
    objectKind: K;
    data: AccessObjects[K];
    syncContext: SyncContext;
    kind: 'update-object';
  };
}[keyof AccessObjects];

export type SyncDeleteObject = {
  [K in keyof AccessObjects]: {
    objectKind: K;
    data: AccessObjects[K];
    syncContext: SyncContext;
    kind: 'delete-object';
  };
}[keyof AccessObjects];

export interface SyncPersonAcl {
  kind: 'person-acl-update';
  syncContext: SyncContext;
  person: string;
  deviceSchedules: Record<string, string | null>;
}

export interface SyncDeviceAcl {
  kind: 'device-acl-update';
  syncContext: SyncContext;
  device: string;
  personSchedules: Record<string, string | null>;
}

export type SyncAction = {
  id: string;
  details: unknown;
};

export type CreateSyncBatch = {
  kind: 'create-sync-batch';
  provider: string;
  syncContext: SyncContext;
  actions: unknown[];
};

export interface SyncBatchDue {
  kind: 'sync-batch-due';
  provider: string;
  actions: SyncAction[];
}

export interface SyncActionDue {
  kind: 'sync-action-due';
  provider: string;
  id: string;
  details: unknown;
}

export type SyncMessage =
  | SyncActionComplete
  | SyncActionFailed
  | SyncMergeObject
  | SyncDeleteObject
  | SyncPersonAcl
  | SyncDeviceAcl
  | SyncBatchDue
  | SyncActionDue
  | CreateSyncBatch;
