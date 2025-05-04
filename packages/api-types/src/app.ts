import { z } from 'zod';

export const sAppInfo = z.object({
  version: z.string(),
  releaseDate: z.string(),
});

export type AppInfo = z.infer<typeof sAppInfo>;
