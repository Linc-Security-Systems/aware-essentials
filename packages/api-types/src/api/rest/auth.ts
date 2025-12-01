import { z } from 'zod';

export const sLoginByCredentialsRequest = z.object({
  username: z.string().nonempty('Username must not be empty'),
  password: z.string().nonempty('Password must not be empty'),
});

export const sLoginByRefreshTokenRequest = z.object({
  refreshToken: z.string().nonempty('Refresh token must not be empty'),
});

export const sLoginResponse = z.object({
  accessToken: z
    .string()
    .describe(
      'Access token to be used for authentication with short expiry time. Apply this token in the Authorization header as a Bearer token.',
    ),
  refreshToken: z
    .string()
    .describe(
      'Refresh token to be used to obtain a new access token when the current one expires.',
    ),
});

export type LoginByCredentialsRequest = z.infer<
  typeof sLoginByCredentialsRequest
>;

export type LoginByRefreshTokenRequest = z.infer<
  typeof sLoginByRefreshTokenRequest
>;

export type LoginResponse = z.infer<typeof sLoginResponse>;
