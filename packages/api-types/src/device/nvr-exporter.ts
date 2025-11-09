import { z } from 'zod';

export const NVR_EXPORTER = 'nvr-exporter';

export const sExporterSpecs = z.object({});
export type ExporterSpecs = z.infer<typeof sExporterSpecs>;

export const sExporterStateDto = z.object({
  connected: z.boolean(),
  exportsInProgress: z.array(z.string().nonempty()),
});

export type ExporterStateDto = z.infer<typeof sExporterStateDto>;
