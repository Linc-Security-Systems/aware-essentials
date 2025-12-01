import { z } from 'zod';
import { LayoutDto } from './layout';
import { DeviceDto } from './device';
import { AccessRuleDto, AccessRuleProps } from './access-rule';
import { AgreementDto } from './agreement';
import { ApiKeyDto } from './api-key';
import { AutomationRuleDto, AutomationRuleProps } from './automation-rule';
import { BookmarkDto } from './bookmark';
import { DeviceGroupDto } from './device-group';
import { MacroDto } from './macro';
import { PersonDto, PersonProps } from './person';
import { PersonPresenceDto } from './person-presence';
import { PersonTypeDto } from './person-type';
import { RoleDto } from './role';
import { ScheduleDto, ScheduleProps } from './schedule';
import { SecurityLevelDto } from './security-level';
import { UserDto } from './user';
import { ViewDto } from './view';
import { ZoneDto, ZoneProps } from './zone';

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
  'personType',
  'agreement',
  'apiKey',
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
  personType: PersonTypeDto;
  agreement: AgreementDto;
  apiKey: ApiKeyDto;
};

export type ObjectDto = ObjectKinds;

export type ObjectProps = {
  person: PersonProps;
  schedule: ScheduleProps;
  zone: ZoneProps;
  accessRule: AccessRuleProps;
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
  personType: 'Person Type',
  agreement: 'Agreement',
  apiKey: 'API Key',
};

export const objectKinds: readonly ObjectKind[] = sObjectKind.options;
