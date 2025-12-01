import { z } from 'zod';

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

export const sExportItem = z.object({
  name: z.string().nonempty(),
  endTime: z.number().int().nonnegative(),
  startTime: z.number().int().nonnegative(),
  id: z.string().nonempty(),
  status: z.string().nonempty(),
  size: z.string().nonempty().optional(),
  expires: z.number().int().nonnegative().optional(),
});

export const sGetExportsResponse = z.array(sExportItem);

export type GetExportsArgs = z.infer<typeof sGetExportsArgs>;

export type ExportItem = z.infer<typeof sExportItem>;

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
