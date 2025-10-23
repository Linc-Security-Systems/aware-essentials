import { z } from 'zod';

export const sCreateApiKeyRequest = z.object({
  displayName: z.string().min(1).max(128),
});

export const sCreateApiKeyResponse = z.object({
  id: z.string().uuid(),
  apiKey: z.string().min(32).max(1024),
});

export const sRevokeApiKeyRequest = z.object({
  id: z.string().uuid(),
});

export const sApiKeyDto = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1).max(128),
  createdOn: z.string().datetime(),
  lastModifiedOn: z.string().datetime(),
});

export type CreateApiKeyRequest = z.infer<typeof sCreateApiKeyRequest>;
export type CreateApiKeyResponse = z.infer<typeof sCreateApiKeyResponse>;
export type RevokeApiKeyRequest = z.infer<typeof sRevokeApiKeyRequest>;
export type ApiKeyDto = z.infer<typeof sApiKeyDto>;
