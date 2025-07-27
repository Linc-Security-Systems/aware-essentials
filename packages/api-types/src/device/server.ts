import {
  AccessRuleDto,
  PersonDto,
  PersonPresenceDto,
  ScheduleDto,
  ZoneDto,
} from '../access-control';
import { z } from 'zod';
import { DeviceDto } from './any-device';
import { AutomationRuleDto } from '../automation';
import { DeviceGroupDto } from '../device-group';
import { MacroDto } from '../macros';
import { LayoutDto } from '../layout';
import { ViewDto } from '../view';
import { RoleDto, UserDto } from '../user';
import { ModuleConfig, ModuleConfigMetadata } from '../module-config';
import { AccessControlCapabilityReport } from '../agent-communication';
import { SecurityLevelDto } from '../security-level';
import { BookmarkDto } from '../bookmarks';

export const SERVER = 'server';

// SPECS

// COMMANDS

export interface RunMacro {
  command: 'server.run-macro';
  params: {
    macroId: string;
  };
}

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

export const sObjectKind = z.enum([
  'accessRule',
  'schedule',
  'person',
  'device',
  'zone',
  'personPresence',
  'deviceGroup',
  'view',
  'layout',
  'automationRule',
  'macro',
  'role',
  'user',
  'securityLevel',
  'bookmark',
]);

export type ObjectKind = z.infer<typeof sObjectKind>;

export type ObjectKinds = {
  layout: LayoutDto;
  view: ViewDto;
  accessRule: AccessRuleDto;
  schedule: ScheduleDto;
  person: PersonDto;
  device: DeviceDto;
  zone: ZoneDto;
  personPresence: PersonPresenceDto;
  automationRule: AutomationRuleDto;
  deviceGroup: DeviceGroupDto;
  macro: MacroDto;
  role: RoleDto;
  user: UserDto;
  securityLevel: SecurityLevelDto;
  bookmark: BookmarkDto;
};

export const objectKinds: readonly ObjectKind[] = sObjectKind.options;

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

export const objectLabels: Record<string, string> = {
  accessRule: 'Access Rule',
  schedule: 'Schedule',
  person: 'Person',
  device: 'Device',
  deviceGroup: 'Device Group',
  zone: 'Zone',
  layout: 'Layout',
  view: 'View',
  role: 'Role',
  user: 'User',
  personPresence: 'Person Presence',
  automationRule: 'Automation Rule',
  macro: 'Macro',
  securityLevel: 'Security Level',
  bookmark: 'Bookmark',
};
