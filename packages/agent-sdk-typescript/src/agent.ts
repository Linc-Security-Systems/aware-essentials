import {
  ValidateProviderConfigRs,
  DeviceDiscoveryDto,
  RunCommandRq,
  AccessValidateChangeRq,
  AccessChangeIssue,
  AccessApplyChange,
  AccessRefMap,
  AccessObjectKind,
} from '@awarevue/api-types';
import { Observable } from 'rxjs';
import { DeviceActivity } from './agent-app';

export type Context = {
  provider: string;
  config: Record<string, unknown>;
};

export type RunContext = Context & {
  deviceCatalog: DeviceDiscoveryDto;
  lastEventForeignRef: string | null;
  lastEventTimestamp: number | null;
};

export type RunCommandContext = Context & {
  deviceCatalog: DeviceDiscoveryDto;
};

export type AccessChangeContext = Context & {
  deviceCatalog: DeviceDiscoveryDto;
  objectsById: <T extends Record<string, unknown>>(
    objectKind: AccessObjectKind,
    objectId: string,
  ) => T[];
  objectByForeignRef: <T extends Record<string, unknown>>(
    objectKind: AccessObjectKind,
    foreignRef: string,
  ) => T | null;
};

export interface Agent {
  getConfigIssues$: (
    context: Context,
  ) => Observable<ValidateProviderConfigRs['issues']>;
  getDevicesAndRelations$: (context: Context) => Observable<DeviceDiscoveryDto>;
  run$: (context: RunContext) => Observable<DeviceActivity>;
  runCommand$: (
    context: RunCommandContext,
    command: RunCommandRq,
  ) => Observable<unknown>;
  validateAccessChange$?: (
    context: AccessChangeContext,
    change: AccessValidateChangeRq,
  ) => Observable<AccessChangeIssue[]>;
  applyAccessChange$?: (
    context: AccessChangeContext,
    change: AccessApplyChange,
  ) => Observable<AccessRefMap>;
  find$?: (
    context: Context,
    objectKind: AccessObjectKind,
    objectIds: string[],
  ) => Observable<Record<string, Record<string, unknown>[]>>;
}
