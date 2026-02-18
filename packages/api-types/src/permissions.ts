import { z } from 'zod';

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
  z.literal('camera:detection').describe('Enable/Disable camera detections'),
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
  z.literal('public-view:read').describe('See public views'),
  z.literal('public-view:update').describe('Update public views'),
  z.literal('public-view:delete').describe('Delete public views'),
  z.literal('public-view:create').describe('Create public views'),
  //Private View
  z.literal('private-view:read').describe('Manage own views'),
  //Person
  z.literal('person:read').describe('View people'),
  z.literal('person:update').describe('Update people'),
  z.literal('person:delete').describe('Delete people'),
  z.literal('person:create').describe('Create people'),
  z.literal('person:assign').describe('Assign credentials and access rules'),
  z.literal('person:print').describe('Print person details'),
  z.literal('person:face').describe('Manage face recognition data'),
  //Zones
  z.literal('zone:update').describe('Update zone'),
  z.literal('zone:delete').describe('Delete zone'),
  z.literal('zone:create').describe('Create zone'),
  //Access Rule
  z.literal('access-rule:read').describe('Read access rule data'),
  z.literal('access-rule:update').describe('Update access rules'),
  z.literal('access-rule:delete').describe('Delete access rule'),
  z.literal('access-rule:create').describe('Create access rule'),
  //Schedule
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
  z.literal('alarm:bypass').describe('Can bypass alarms'),
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
  z.literal('role:create').describe('Create role'),
  z.literal('role:delete').describe('Delete role'),
  z.literal('role:update').describe('Update role data'),
  //Module
  z.literal('module:read').describe('View module settings'),
  z.literal('module:update').describe('Update module settings'),
  z.literal('module:enable').describe('Enable and disable modules'),
  //Device
  z.literal('device:discover').describe('Scan for device changes'),
  z.literal('device:import').describe('Apply device changes'),
  z.literal('device:override-specs').describe('Configure device capabilities'),
  z.literal('device:notes').describe('View and Edit device notes'),
  z.literal('device:rename').describe('Rename device'),
  z.literal('device:alarms').describe('Configure device alarms'),
  //Automation
  z.literal('automation:read').describe('View automation data'),
  z.literal('automation:update').describe('Update automation data'),
  z.literal('automation:delete').describe('Delete automation'),
  z.literal('automation:create').describe('Create automation'),
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
  //Notifications
  z.literal('notification:read').describe('Receive notifications'),
  z.literal('notification:create').describe('Send notifications'),
  z.literal('notification:acknowledge').describe('Acknowledge notifications'),
  //Templates
  z.literal('template:update').describe('Update templates'),
  z.literal('template:delete').describe('Delete template'),
  z.literal('template:create').describe('Create template'),
  //Custom Fields
  z.literal('custom-field:update').describe('Update custom fields'),
  z.literal('custom-field:delete').describe('Delete custom field'),
  z.literal('custom-field:create').describe('Create custom field'),
  //Display
  z.literal('display:read').describe('Cast to displays'),
  //Security Level
  z.literal('security-level:update').describe('Update security levels'),
  z.literal('security-level:delete').describe('Delete security level'),
  z.literal('security-level:create').describe('Create security level'),
  //Citadel mode
  z.literal('citadel-mode:toggle').describe('Enter / exit citadel mode'),
  //Token Conversion
  z.literal('token-conversion:update').describe('Update token conversion data'),
  z.literal('token-conversion:delete').describe('Delete token conversion'),
  z.literal('token-conversion:create').describe('Create token conversion'),
  //Bookmarks
  z.literal('bookmark:read').describe('View bookmarks'),
  z.literal('bookmark:create').describe('Create bookmark'),
  z.literal('bookmark:update').describe('Update bookmark'), //No UI effect yet
  z.literal('bookmark:delete').describe('Delete bookmark'),
  //Access Paths
  z.literal('access-path:read').describe('View access paths'),
  z.literal('access-path:create').describe('Create access path'),
  z.literal('access-path:update').describe('Update access path'),
  z.literal('access-path:delete').describe('Delete access path'),
  //Person Types
  z.literal('person-type:create').describe('Create person type'),
  z.literal('person-type:update').describe('Update person type'),
  z.literal('person-type:delete').describe('Delete person type'),
  //Agreements
  z.literal('agreement:create').describe('Create agreements'),
  z.literal('agreement:update').describe('Update agreements'),
  z.literal('agreement:delete').describe('Delete agreements'),
  //API Keys
  z.literal('api-key:create').describe('Create API key'),
  z.literal('api-key:revoke').describe('Revoke API key'),
  //Access Authority
  z
    .literal('access-authority:read')
    .describe('View access control authorities'),
  z.literal('access-authority:sync').describe('Perform access sync'),
  z.literal('access-authority:delete').describe('Remove an access authority'),
]);

export type PermissionArea =
  | 'layout'
  | 'camera'
  | 'preset'
  | 'door'
  | 'public-view'
  | 'private-view'
  | 'person'
  | 'zone'
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
  | 'device'
  | 'display'
  | 'security-level'
  | 'citadel-mode'
  | 'token-conversion'
  | 'bookmark'
  | 'access-path'
  | 'person-type'
  | 'agreement'
  | 'api-key'
  | 'access-authority'
  | 'notification';

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
