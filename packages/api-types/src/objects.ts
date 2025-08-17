import { z } from 'zod';
import {
  AccessRuleDto,
  ScheduleDto,
  PersonDto,
  ZoneDto,
  PersonPresenceDto,
  CreatePersonRequest,
  CreateScheduleRequest,
  CreateZoneRequest,
  CreateAccessRuleRequest,
} from './access-control';
import { AutomationRuleDto, AutomationRuleProps } from './automation';
import { BookmarkDto } from './bookmarks';
import { DeviceDto } from './device';
import { DeviceGroupDto } from './device-group';
import { LayoutDto } from './layout';
import { MacroDto } from './macros';
import { SecurityLevelDto } from './security-level';
import { RoleDto, UserDto } from './user';
import { ViewDto } from './view';

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

export type ObjectDto = ObjectKinds;

export type ObjectProps = {
  person: CreatePersonRequest;
  schedule: CreateScheduleRequest;
  zone: CreateZoneRequest;
  accessRule: CreateAccessRuleRequest;
  automationRule: AutomationRuleProps;
};

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

export const objectKinds: readonly ObjectKind[] = sObjectKind.options;
