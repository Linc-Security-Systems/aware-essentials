import {
  ValidateProviderConfigRs,
  DeviceDiscoveryDto,
  RunCommandRq,
  AccessValidateChangeRq,
  AccessChangeIssue,
  AccessApplyChange,
  AccessRefMap,
} from '@awarevue/api-types';
import { Observable } from 'rxjs';
import { DeviceActivity } from './agent-app';

export type Context = {
  provider: string;
  config: Record<string, unknown>;
};

export type RunContext = Context & {
  lastEventForeignRef: string | null;
  lastEventTimestamp: number | null;
};

export interface Agent {
  getConfigIssues$: (
    context: Context,
  ) => Observable<ValidateProviderConfigRs['issues']>;
  getDevicesAndRelations$: (context: Context) => Observable<DeviceDiscoveryDto>;
  run$: (context: RunContext) => Observable<DeviceActivity>;
  runCommand$: (context: Context, command: RunCommandRq) => Observable<unknown>;
  validateAccessChange$?: (
    context: Context,
    change: AccessValidateChangeRq,
  ) => Observable<AccessChangeIssue[]>;
  applyAccessChange$?: (
    context: Context,
    change: AccessApplyChange,
  ) => Observable<AccessRefMap>;
}
