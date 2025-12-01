import { AccessControlCapabilityReport } from '../../objects';
import { ModuleConfig, ModuleConfigMetadata } from '../module-config';
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
  runningAgents: Record<string, string[]>;
  configMetadata: ModuleConfigMetadata;
  config: ModuleConfig;
  runnableProviders: string[];
  accessControlProviders: Record<string, AccessControlProviderState>;
  citadelMode: boolean;
};
