import { sPermissionId } from '../permissions';
import { z } from 'zod';

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

export type RoleDto = z.infer<typeof sRoleDto>;
