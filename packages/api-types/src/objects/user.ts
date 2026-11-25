import { z } from 'zod';

export const USER_PASSWORD_MIN_LENGTH = 4;
export const USER_PASSWORD_MAX_LENGTH = 64;

export const sUserPassword = z
  .string()
  .min(USER_PASSWORD_MIN_LENGTH)
  .max(USER_PASSWORD_MAX_LENGTH);

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
