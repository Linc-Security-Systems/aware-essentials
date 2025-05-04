import { z } from 'zod';
import { sPermissionId } from './permissions';

export const sNewUserRequest = z.object({
  firstName: z.string().min(1).max(64).nonempty(),
  lastName: z.string().min(1).max(64).nonempty(),
  email: z.string().email().nullable(),
  username: z.string().min(1).max(64).nonempty(),
  password: z.string().min(8).max(64).nonempty(),
  roles: z.array(z.string()).min(1),
  isActive: z.boolean(),
});

export const sUpdateUserRequest = z.object({
  id: z.string(),
  firstName: z.string().min(1).max(64).optional(),
  lastName: z.string().min(1).max(64).optional(),
  email: z.string().email().nullable().optional(),
  username: z.string().min(3).max(64).optional(),
  password: z.string().min(8).max(64).optional(),
  isActive: z.boolean().optional(),
  roles: z.array(z.string()).min(1).optional(),
});

export const sChangeSelfPasswordRequest = z.object({
  oldPassword: z.string().min(1).max(64).nonempty(),
  newPassword: z.string().min(8).max(64).nonempty(),
});

export const sUserDto = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  username: z.string(),
  isActive: z.boolean(),
  isRoot: z.boolean(),
  roles: z.array(z.string()),
});

export const sMeResponse = sUserDto.merge(
  z.object({
    permissions: z.array(sPermissionId),
  }),
);

export const sRoleDto = z.object({
  id: z.string().uuid(),
  displayName: z.string().nonempty().max(100),
  systemName: z
    .string()
    .nonempty()
    .max(64)
    .refine((value) => !/\s/.test(value), {
      message: 'System name must not contain spaces',
    }),
  description: z.string().nonempty(),
  permissions: z.array(sPermissionId),
});

export const sAddRoleRequest = sRoleDto.omit({ id: true });

export const sUpdateRoleRequest = sAddRoleRequest.partial();

export type NewUserRequest = z.infer<typeof sNewUserRequest>;

export type UpdateUserRequest = z.infer<typeof sUpdateUserRequest>;

export type ChangeSelfPasswordRequest = z.infer<
  typeof sChangeSelfPasswordRequest
>;

export type UserDto = z.infer<typeof sUserDto>;

export type MeResponse = z.infer<typeof sMeResponse>;

export type RoleDto = z.infer<typeof sRoleDto>;

export type AddRoleRequest = z.infer<typeof sAddRoleRequest>;

export type UpdateRoleRequest = z.infer<typeof sUpdateRoleRequest>;
