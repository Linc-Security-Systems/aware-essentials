import {
  AccessRuleDto,
  PersonDto,
  PersonPresenceDto,
  ScheduleDto,
  ZoneDto,
} from '../access-control';
import { DeviceDto } from './any-device';
import { AutomationRuleDto } from '../automation';
import { DeviceGroupDto } from '../device-group';
import { MacroDto } from '../macros';
import { LayoutDto } from '../layout';
import { ViewDto } from '../view';
import { RoleDto } from '../user';
import { ModuleConfig, ModuleConfigMetadata } from '../module-config';

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

export type ServerState = {
  runningAgents: Record<string, string[]>;
  configMetadata: ModuleConfigMetadata;
  config: ModuleConfig;
};

// EVENTS

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
};

export const objectKinds: readonly (keyof ObjectKinds)[] = [
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
] as const;

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

export type ServerEvent = ObjectCreated | ObjectUpdated | ObjectDeleted;

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
};
