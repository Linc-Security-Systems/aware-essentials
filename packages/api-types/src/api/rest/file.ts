import { z } from 'zod';

export const sFileUploadResponse = z.object({
  id: z.string(),
});
export type FileUploadResponse = z.infer<typeof sFileUploadResponse>;
