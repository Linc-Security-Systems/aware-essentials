import { z } from 'zod';

export const sTokenAuthorized = z.object({
  kind: z.literal('reader-auth'),
  token: z.string().nullable(),
  personId: z.string().optional(),
  allowed: z.boolean(),
});

export type TokenAuthorized = z.infer<typeof sTokenAuthorized>;

export const readerEventSchemaByKind = {
  'reader-auth': sTokenAuthorized,
} as const;

export type ReaderEvent = TokenAuthorized;
