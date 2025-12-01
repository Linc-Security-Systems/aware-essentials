import { z } from 'zod';

// EVENTS

export const sExportStarted = z.object({
  kind: z.literal('nvr-export-started'),
  exportId: z
    .string()
    .nonempty()
    .describe(
      'The ID of the export, will be used to reference the export in future commands and queries',
    ),
  requestId: z.string().nonempty(),
});

export type ExportStarted = z.infer<typeof sExportStarted>;

export const sExportDeleted = z.object({
  kind: z.literal('nvr-export-deleted'),
  exportId: z.string().nonempty(),
});

export type ExportDeleted = z.infer<typeof sExportDeleted>;

export type NvrExporterEvent = ExportStarted | ExportDeleted;

export const nvrExporterEventSchemasByKind = {
  'nvr-export-started': sExportStarted,
  'nvr-export-deleted': sExportDeleted,
} as const;
