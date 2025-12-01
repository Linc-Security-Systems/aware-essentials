import { z } from 'zod';
import { sPermissionId } from '../../permissions';
import { sUserDto, sUserPassword } from '../../objects/user';
import { sRoleDto } from '../../objects/role';

export const sNewUserRequest = z.object({
  firstName: z.string().min(1).max(64).nonempty(),
  lastName: z.string().min(1).max(64).nonempty(),
  email: z.string().email().nullable(),
  username: z.string().min(1).max(64).nonempty(),
  password: sUserPassword.nonempty(),
  roles: z.array(z.string()).min(1),
  isActive: z.boolean(),
});

export const sUpdateUserRequest = z.object({
  id: z.string(),
  firstName: z.string().min(1).max(64).optional(),
  lastName: z.string().min(1).max(64).optional(),
  email: z.string().email().nullable().optional(),
  username: z.string().min(3).max(64).optional(),
  password: sUserPassword.optional(),
  isActive: z.boolean().optional(),
  roles: z.array(z.string()).min(1).optional(),
});

export const sChangeSelfPasswordRequest = z.object({
  oldPassword: sUserPassword.nonempty(),
  newPassword: sUserPassword.nonempty(),
});

export const sMeResponse = sUserDto.merge(
  z.object({
    permissions: z.array(sPermissionId),
  }),
);

export const sAddRoleRequest = sRoleDto.omit({ id: true });

export const sUpdateRoleRequest = sAddRoleRequest.partial();

export type NewUserRequest = z.infer<typeof sNewUserRequest>;

export type UpdateUserRequest = z.infer<typeof sUpdateUserRequest>;

export type ChangeSelfPasswordRequest = z.infer<
  typeof sChangeSelfPasswordRequest
>;

export type MeResponse = z.infer<typeof sMeResponse>;

export type AddRoleRequest = z.infer<typeof sAddRoleRequest>;

export type UpdateRoleRequest = z.infer<typeof sUpdateRoleRequest>;
