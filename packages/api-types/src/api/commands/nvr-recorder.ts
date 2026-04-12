import { z } from 'zod';
import { sDeviceParam, sStreamId } from '../../primitives';

// COMMANDS
export const sMountStreamCommand = z.object({
  command: z.literal('nvr-recorder.mount-stream'),
  params: z.object({
    camera: sDeviceParam,
    streamId: sStreamId,
    rtspUrl: z.string().nonempty(),
    retentionHours: z.number().int().positive().optional(),
    prebufferSeconds: z.number().int().nonnegative().optional(),
  }),
});

export type MountStreamCommand = z.infer<typeof sMountStreamCommand>;

export const sUnmountStreamCommand = z.object({
  command: z.literal('nvr-recorder.unmount-stream'),
  params: z.object({
    camera: sDeviceParam,
    streamId: sStreamId,
  }),
});

export type UnmountStreamCommand = z.infer<typeof sUnmountStreamCommand>;

export const sStartRecordingCommand = z.object({
  command: z.literal('nvr-recorder.start-recording'),
  params: z.object({
    camera: sDeviceParam,
    streamId: sStreamId,
  }),
});

export type StartRecordingCommand = z.infer<typeof sStartRecordingCommand>;

export const sStopRecordingCommand = z.object({
  command: z.literal('nvr-recorder.stop-recording'),
  params: z.object({
    camera: sDeviceParam,
    streamId: sStreamId,
  }),
});

export type StopRecordingCommand = z.infer<typeof sStopRecordingCommand>;

export type NvrRecorderCommand =
  | StartRecordingCommand
  | StopRecordingCommand
  | MountStreamCommand
  | UnmountStreamCommand;

export const nvrRecorderCommandSchemas = {
  'nvr-recorder.start-recording': sStartRecordingCommand,
  'nvr-recorder.stop-recording': sStopRecordingCommand,
  'nvr-recorder.mount-stream': sMountStreamCommand,
  'nvr-recorder.unmount-stream': sUnmountStreamCommand,
} as const;
