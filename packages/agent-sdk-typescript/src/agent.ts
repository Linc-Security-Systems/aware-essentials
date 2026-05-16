import {
  ValidateProviderConfigRs,
  DeviceDiscoveryDto,
  RunCommandRq,
  AccessValidateChangeRq,
  AccessChangeIssue,
  AccessApplyChange,
  AccessRefMap,
  AccessObjectKind,
  ObjectKinds,
  QueryRq,
  PushFile,
  ExternalObjectProps,
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
  objectsById: <K extends AccessObjectKind>(
    objectKind: K,
    objectId: string,
  ) => ObjectKinds[K][];
  objectByForeignRef: <K extends AccessObjectKind>(
    objectKind: K,
    foreignRef: string,
  ) => ObjectKinds[K] | null;
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
  getResult$?: (context: Context, query: QueryRq) => Observable<unknown>;
  validateAccessChange$?: (
    context: AccessChangeContext,
    change: AccessValidateChangeRq,
  ) => Observable<AccessChangeIssue[]>;
  applyAccessChange$?: (
    context: AccessChangeContext,
    change: AccessApplyChange,
  ) => Observable<AccessRefMap>;
  find$?: <K extends AccessObjectKind>(
    context: Context,
    objectKind: K,
    objectIds: string[],
  ) => Observable<Record<string, ExternalObjectProps[K]>>;
  pushFile?: (context: Context, req: PushFile) => Observable<boolean>;
}
