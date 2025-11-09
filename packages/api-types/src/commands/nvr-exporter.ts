import { sDeviceParam } from '../primitives';
import { z } from 'zod';

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

export type NvrExporterCommand = StartExportCommand | DeleteExportCommand;

export const nvrExporterCommandSchemas = {
  'nvr-exporter.start-export': sStartExportCommand,
  'nvr-exporter.delete-export': sDeleteExportCommand,
} as const;
