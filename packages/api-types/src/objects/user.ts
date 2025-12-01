import { z } from 'zod';

export const sUserPassword = z.string().min(4).max(64);

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

export type UserDto = z.infer<typeof sUserDto>;
