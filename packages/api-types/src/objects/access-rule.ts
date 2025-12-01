import { z } from 'zod';

export const sAccessRulePersonDto = z.object({
  id: z.string().describe('Person ID'),
  firstName: z.string().describe('First name'),
  lastName: z.string().describe('Last name'),
  avatarId: z.string().nullable().describe('Avatar ID'),
});

export type AccessRulePersonDto = z.infer<typeof sAccessRulePersonDto>;

export const sAccessRulePermissionDto = z.object({
  deviceId: z.string().describe('Device ID').nonempty(),
  scheduleId: z.string().describe('Schedule ID').nonempty(),
});

export type AccessRulePermissionDto = z.infer<typeof sAccessRulePermissionDto>;

export const sAccessRuleGroupPermissionDto = z.object({
  groupId: z.string().describe('Group ID').nonempty(),
  scheduleId: z.string().describe('Schedule ID').nonempty(),
});

export type AccessRuleGroupPermissionDto = z.infer<
  typeof sAccessRuleGroupPermissionDto
>;

export const sAccessRuleDto = z.object({
  id: z.string().describe('Access rule ID'),
  displayName: z.string().describe('Display name'),
  appliedTo: z.array(sAccessRulePersonDto).describe('Applied to'),
  permissions: z.array(sAccessRulePermissionDto).describe('Permissions'),
  groupPermissions: z
    .array(sAccessRuleGroupPermissionDto)
    .describe('Group permissions'),
  createdOn: z.string().describe('Created on'),
  lastModifiedOn: z.string().describe('Last modified on'),
  refs: z.record(z.union([z.string(), z.array(z.string())])),
  version: z.number().describe('Version'),
});

export type AccessRuleDto = z.infer<typeof sAccessRuleDto>;

export const sAccessRuleProps = z.object({
  displayName: z.string().nonempty().describe('Display name'),
  appliedTo: z.array(z.string().nonempty()).describe('Applied to'),
  permissions: z.array(sAccessRulePermissionDto).describe('Permissions'),
  groupPermissions: z
    .array(sAccessRuleGroupPermissionDto)
    .describe('Group permissions'),
});

export type AccessRuleProps = z.infer<typeof sAccessRuleProps>;
