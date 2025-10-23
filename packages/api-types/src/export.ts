import { z } from 'zod';

export const sExport = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  status: z.string().nonempty(),
  exportId: z.string().optional(),
  expires: z.number().optional(),
  size: z.string().optional(),
});

export type Export = z.infer<typeof sExport>;
