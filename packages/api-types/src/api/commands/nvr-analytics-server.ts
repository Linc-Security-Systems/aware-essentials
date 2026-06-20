import { z } from 'zod';
import { sDeviceParam, sStreamId } from '../../primitives';
import { sAiStreamConfiguration } from '../../objects/device/device-relation';

// COMMANDS

export const sSetStreamAnalyticsCommand = z.object({
  command: z.literal('nvr-analytics-server.set-stream-analytics'),
  params: z
    .object({
      device: sDeviceParam,
      streamId: sStreamId,
    })
    .extend(sAiStreamConfiguration.shape),
});

export type SetStreamAnalyticsCommand = z.infer<
  typeof sSetStreamAnalyticsCommand
>;

export type NvrAnalyticsServerCommand = SetStreamAnalyticsCommand;

export const nvrAnalyticsServerCommandSchemas = {
  'nvr-analytics-server.set-stream-analytics': sSetStreamAnalyticsCommand,
} as const;
