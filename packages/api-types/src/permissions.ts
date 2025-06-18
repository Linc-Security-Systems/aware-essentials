import { z } from 'zod';
import { DeviceType } from './device';

type DeviceTypePermissionsMap = {
  [K in DeviceType]: z.ZodLiteral<`device:${K}`>;
};

// Some Device Types omitted for now until we work out if they are needed
const deviceTypePermissions: Omit<
  DeviceTypePermissionsMap,
  | 'server'
  | 'alarm'
  | 'pbx'
  | 'device-gateway'
  | 'reader'
  | 'io-board'
  | 'camera-lift'
  | 'intercom-operator'
  | 'presence-tracker'
> = {
  camera: z.literal('device:camera').describe('View cameras'),
  door: z.literal('device:door').describe('View doors'),
  'motion-sensor': z
    .literal('device:motion-sensor')
    .describe('View motion sensors'),
  'panic-button': z
    .literal('device:panic-button')
    .describe('View panic buttons'),
  'intercom-terminal': z
    .literal('device:intercom-terminal')
    .describe('View intercom terminals'),
  display: z.literal('device:display').describe('View displays'),
};

const sDeviceTypePermissions = Object.values(deviceTypePermissions);

export const sPermissionId = z.union([
  //Layout
  z.literal('layout:read').describe('Read layout data'),
  z.literal('layout:update').describe('Update layouts'),
  z.literal('layout:delete').describe('Delete layout'),
  z.literal('layout:create').describe('Create layout'),
  //Camera
  z.literal('camera:live').describe('View live camera feed'),
  z.literal('camera:playback').describe('View camera playback'),
  z.literal('camera:playback-export').describe('Export camera playback'),
  z.literal('camera:ptz').describe('Control camera PTZ'),
  z.literal('camera:privacy-mode').describe('Control camera privacy mode'),
  z.literal('camera:assign').describe('Assign adjacent cameras to devices'),
  //Preset
  z.literal('preset:read').describe('Use camera presets'),
  z.literal('preset:update').describe('Update presets'),
  z.literal('preset:delete').describe('Delete preset'),
  z.literal('preset:create').describe('Create preset'),
  //Door
  z.literal('door:release').describe('Release door'),
  z.literal('door:lock').describe('Lock or unlock door'),
  //Camera Lift
  z.literal('camera-lift:activate').describe('Activate camera lifts'),
  //IO Board
  z.literal('io-board:activate').describe('Activate IO board outputs'),
  //Public View
  z.literal('public-view:read').describe('Read public view data'),
  z.literal('public-view:update').describe('Update public views'),
  z.literal('public-view:delete').describe('Delete public view'),
  z.literal('public-view:create').describe('Create public view'),
  //Private View
  z.literal('private-view:read').describe('Read private view data'),
  z.literal('private-view:update').describe('Update private views'),
  z.literal('private-view:delete').describe('Delete private view'),
  z.literal('private-view:create').describe('Create private view'),
  //Person
  z.literal('person:read').describe('Read person data'),
  z.literal('person:update').describe('Update person data'),
  z.literal('person:delete').describe('Delete person'),
  z.literal('person:create').describe('Create person'),
  z.literal('person:assign').describe('Assign credentials and access rules'),
  z.literal('person:print').describe('Print person details'),
  //Doors and Groups (needs access to doors to be useful)
  z.literal('door-group:read').describe('Read door group data'),
  z.literal('door-group:update').describe('Update door group'),
  z.literal('door-group:delete').describe('Delete door group'),
  z.literal('door-group:create').describe('Create door group'),
  //Access Rule
  z.literal('access-rule:read').describe('Read access rule data'),
  z.literal('access-rule:update').describe('Update access rules'),
  z.literal('access-rule:delete').describe('Delete access rule'),
  z.literal('access-rule:create').describe('Create access rule'),
  //Schedule
  z.literal('schedule:read').describe('Read schedule data'),
  z.literal('schedule:update').describe('Update schedule data'),
  z.literal('schedule:delete').describe('Delete schedule'),
  z.literal('schedule:create').describe('Create schedule'),
  //Presence
  z.literal('presence:read').describe('Read presence data'),
  z.literal('presence:update').describe('Update presence data'),
  z
    .literal('presence:update-reader')
    .describe('Update presence via USB reader'),
  //Factory
  z.literal('factory:read').describe('Read custom devices'),
  z.literal('factory:update').describe('Update custom devices'),
  z.literal('factory:delete').describe('Delete custom device'),
  z.literal('factory:create').describe('Create custom device'),
  //Event
  z.literal('event:read').describe('View events'),
  z.literal('event:purge').describe('Clear events'), //No UI effect yet
  //Alarm
  z.literal('alarm:read').describe('View alarms'),
  z.literal('alarm:acknowlede').describe('Acknowledge alarms'),
  z.literal('alarm:arm').describe('Can arm or disarm'),
  z.literal('alarm:trigger').describe('Can trigger alarms'),
  //User
  z.literal('user:read').describe('View user data'),
  z.literal('user:change-password').describe('Change user password'),
  z.literal('user:change-username').describe('Change user login id'),
  z.literal('user:change-name').describe('Change user name'),
  z.literal('user:change-email').describe('Change user email'),
  z.literal('user:activate').describe('Activate or Deactivate user'),
  z.literal('user:delete').describe('Delete user'),
  z.literal('user:change-roles').describe('Change user roles'),
  z.literal('user:create').describe('Create user'),
  //Role
  z.literal('role:read').describe('View role data'),
  z.literal('role:create').describe('Create role'),
  z.literal('role:delete').describe('Delete role'),
  z.literal('role:update').describe('Update role data'),
  //Module
  z.literal('module:read').describe('View module settings'),
  z.literal('module:update').describe('Update module settings'),
  z.literal('module:enable').describe('Enable and disable modules'),
  //Device
  z.literal('device:discover').describe('Discover devices'), //No UI effect yet
  z.literal('device:import').describe('Import discovered devices'), //No UI effect yet
  z.literal('device:override-specs').describe('Override device specs'),
  //Automation
  z.literal('automation:read').describe('View automation data'),
  z.literal('automation:update').describe('Update automation data'), //No UI effect yet
  z.literal('automation:delete').describe('Delete automation'), //No UI effect yet
  z.literal('automation:create').describe('Create automation'), //No UI effect yet
  //Device Groups
  z.literal('device-group:read').describe('View device groups'),
  z.literal('device-group:update').describe('Update device groups'),
  z.literal('device-group:delete').describe('Delete device group'),
  z.literal('device-group:create').describe('Create device group'),
  //Macros
  z.literal('macro:read').describe('View macros'),
  z.literal('macro:update').describe('Update macros'),
  z.literal('macro:delete').describe('Delete macro'),
  z.literal('macro:create').describe('Create macro'),
  z.literal('macro:run').describe('Run macro'),
  //Templates
  z.literal('template:read').describe('View templates'),
  z.literal('template:update').describe('Update templates'),
  z.literal('template:delete').describe('Delete template'),
  z.literal('template:create').describe('Create template'),
  //Custom Fields
  z.literal('custom-field:read').describe('View custom fields'),
  z.literal('custom-field:update').describe('Update custom fields'),
  z.literal('custom-field:delete').describe('Delete custom field'),
  z.literal('custom-field:create').describe('Create custom field'),
  //Media
  z.literal('media:read').describe('View media page'),
  //About
  z.literal('about:read').describe('View about data'),
  //Intercom
  z.literal('intercom:read').describe('View intercom data'), //No UI effect yet
  //Display
  z.literal('display:read').describe('Cast to displays'),
  ...sDeviceTypePermissions, //No UI effects yet
  //Security Level
  z.literal('security-level:read').describe('View security levels'),
  z.literal('security-level:update').describe('Update security levels'),
  z.literal('security-level:delete').describe('Delete security level'),
  z.literal('security-level:create').describe('Create security level'),
  // citadel mode
  z.literal('citadel-mode:toggle').describe('Enter / exit citadel mode'),
]);

export type PermissionArea =
  | 'layout'
  | 'camera'
  | 'preset'
  | 'door'
  | 'public-view'
  | 'private-view'
  | 'person'
  | 'door-group'
  | 'access-rule'
  | 'schedule'
  | 'presence'
  | 'factory'
  | 'event'
  | 'alarm'
  | 'user'
  | 'role'
  | 'device'
  | 'module'
  | 'automation'
  | 'device-group'
  | 'macro'
  | 'template'
  | 'custom-field'
  | 'media'
  | 'about'
  | 'intercom'
  | 'device'
  | 'display'
  | 'security-level'
  | 'citadel-mode';

const permissionsToRecord = (
  permissions: typeof sPermissionId,
): Record<PermissionId, string> => {
  const options = permissions.options;
  return options.reduce(
    (acc: Record<PermissionId, string>, option) => {
      const key = option.value;
      const description = option.description;
      acc[key] = description || '';
      return acc;
    },
    {} as Record<PermissionId, string>,
  );
};

const permissionsToArray = (permissions: typeof sPermissionId) => {
  const options = permissions.options;
  return options.map((option) => option.value);
};

export const permissions = permissionsToRecord(sPermissionId);
export const permissionsArray = permissionsToArray(sPermissionId);
export type PermissionId = z.infer<typeof sPermissionId>;
