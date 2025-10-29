import { sDeviceParam } from '../primitives';
import { z } from 'zod';

export const NVR_EXPORTER = 'nvr-exporter';

export const sExporterSpecs = z.object({});
export type ExporterSpecs = z.infer<typeof sExporterSpecs>;

export const sExporterStateDto = z.object({
  connected: z.boolean(),
  exportsInProgress: z.array(z.string().nonempty()),
});

export type ExporterStateDto = z.infer<typeof sExporterStateDto>;

// COMMANDS
export const sStartExportCommand = z.object({
  command: z.literal('nvr-exporter.start-export'),
  params: z.object({
    requestId: z.string().nonempty(),
    device: sDeviceParam,
    timeFrom: z.number().int().nonnegative(),
    timeTo: z.number().int().nonnegative(),
    name: z.string().nonempty(),
  }),
});

export type StartExportCommand = z.infer<typeof sStartExportCommand>;

export const sDeleteExportCommand = z.object({
  command: z.literal('nvr-exporter.delete-export'),
  params: z.object({
    exportId: z.string().nonempty(),
  }),
});

export type DeleteExportCommand = z.infer<typeof sDeleteExportCommand>;

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

// QUERIES

// -- Get Export Link

export const QUERY_GET_EXPORT_LINK = 'cctv:get-export-link';

export const sGetExportLinkArgs = z.object({
  exportId: z.string().nonempty(),
});

export const sGetExportLinkResponse = z.object({
  exportLink: z.string().url(),
});

export type GetExportLinkArgs = z.infer<typeof sGetExportLinkArgs>;

export type GetExportLinkResponse = z.infer<typeof sGetExportLinkResponse>;

// -- Get Exports

export const QUERY_GET_EXPORTS = 'cctv:get-exports';

export const sGetExportsArgs = z.object({});

export const sGetExportsResponse = z.array(
  z.object({
    name: z.string().nonempty(),
    endTime: z.number().int().nonnegative(),
    startTime: z.number().int().nonnegative(),
    id: z.string().nonempty(),
    status: z.string().nonempty(),
    size: z.string().nonempty().optional(),
    exportId: z.string().nonempty().optional(),
    expires: z.number().int().nonnegative().optional(),
  }),
);

export type GetExportsArgs = z.infer<typeof sGetExportsArgs>;

export type GetExportsResponse = z.infer<typeof sGetExportsResponse>;

// Dictionary of request schemas by query type
export const nvrExporterRequestSchemas = {
  [QUERY_GET_EXPORT_LINK]: sGetExportLinkArgs,
  [QUERY_GET_EXPORTS]: sGetExportsArgs,
} as const;

// Dictionary of response schemas by query type
export const nvrExporterResponseSchemas = {
  [QUERY_GET_EXPORT_LINK]: sGetExportLinkResponse,
  [QUERY_GET_EXPORTS]: sGetExportsResponse,
} as const;

// TypeScript mapping types for requests and responses
export type NvrExporterQueryRequestMap = {
  [QUERY_GET_EXPORT_LINK]: GetExportLinkArgs;
  [QUERY_GET_EXPORTS]: GetExportsArgs;
};

export type NvrExporterQueryResponseMap = {
  [QUERY_GET_EXPORT_LINK]: GetExportLinkResponse;
  [QUERY_GET_EXPORTS]: GetExportsResponse;
};
