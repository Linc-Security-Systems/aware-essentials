import { ConfigState } from '../../objects/device/changeset';
import { AccessControlCapabilityReport } from '../agent-metadata';
import { ModuleConfigMetadata } from '../module-config';
export const SERVER = 'server';

// STATE

export type AccessControlProviderState = AccessControlCapabilityReport & {
  syncInProgress: boolean;
  lastSyncError: string | null;
  syncTotal: number;
  syncComplete: number;
  running: boolean;
};

export type ServerState = {
  activeProviders: string[];
  configMetadata: ModuleConfigMetadata;
  runnableProviders: string[];
  accessControlProviders: Record<string, AccessControlProviderState>;
  citadelMode: boolean;
  deviceChanges: ConfigState;
  timeZone: string;
};
