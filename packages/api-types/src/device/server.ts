import { z } from 'zod';
import { ModuleConfig, ModuleConfigMetadata } from '../module-config';
import { AccessControlCapabilityReport } from '../agent-communication';
import { ObjectKinds } from '../objects';
import { sMacroId } from '../primitives';

export const SERVER = 'server';

// SPECS

// COMMANDS

export const sRunMacroCommand = z.object({
  command: z.literal('server.run-macro'),
  params: z.object({
    macroId: sMacroId,
  }),
});

export type RunMacro = z.infer<typeof sRunMacroCommand>;

export const serverCommands = {
  'server.run-macro': sRunMacroCommand,
} as const;

export type ServerCommand = RunMacro;

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

// EVENTS

export const sAgentStarted = z.object({
  kind: z.literal('agent-started'),
  agent: z.string(),
  providers: z.array(z.string()),
});

export const sAgentStopped = z.object({
  kind: z.literal('agent-stopped'),
  agent: z.string(),
  providers: z.array(z.string()),
});

export type AgentStarted = z.infer<typeof sAgentStarted>;
export type AgentStopped = z.infer<typeof sAgentStopped>;

export type ObjectCreated = {
  [K in keyof ObjectKinds]: {
    originator: string;
    objectVersion: number;
    objectKind: K;
    data: ObjectKinds[K];
    objectId: string;
    kind: 'object-created';
    userId?: string;
  };
}[keyof ObjectKinds];

export type ObjectUpdated = {
  [K in keyof ObjectKinds]: {
    originator: string;
    objectVersion: number;
    objectKind: K;
    original: ObjectKinds[K];
    changes: Partial<ObjectKinds[K]>;
    objectId: string;
    kind: 'object-updated';
    userId?: string;
  };
}[keyof ObjectKinds];

export type ObjectDeleted = {
  [K in keyof ObjectKinds]: {
    originator: string;
    objectVersion: number;
    objectKind: K;
    data: ObjectKinds[K];
    objectId: string;
    kind: 'object-deleted';
    userId?: string;
  };
}[keyof ObjectKinds];

export type ServerEvent =
  | ObjectCreated
  | ObjectUpdated
  | ObjectDeleted
  | AgentStarted
  | AgentStopped;
