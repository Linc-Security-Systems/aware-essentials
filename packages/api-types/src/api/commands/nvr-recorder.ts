import { z } from 'zod';
import { sDeviceParam } from '../../primitives';

// COMMANDS
export const sMountStreamCommand = z.object({
  command: z.literal('nvr-recorder.mount-stream'),
  params: z.object({
    camera: sDeviceParam,
    streamId: z.string().nonempty(),
    rtspUrl: z.string().nonempty(),
    retentionHours: z.number().int().positive().optional(),
  }),
});

export type MountStreamCommand = z.infer<typeof sMountStreamCommand>;

export const sUnmountStreamCommand = z.object({
  command: z.literal('nvr-recorder.unmount-stream'),
  params: z.object({
    camera: sDeviceParam,
    streamId: z.string().nonempty(),
  }),
});

export type UnmountStreamCommand = z.infer<typeof sUnmountStreamCommand>;

export const sStartRecordingCommand = z.object({
  command: z.literal('nvr-recorder.start-recording'),
  params: z.object({
    camera: sDeviceParam,
    streamId: z.string().nonempty(),
  }),
});

export type StartRecordingCommand = z.infer<typeof sStartRecordingCommand>;

export const sStopRecordingCommand = z.object({
  command: z.literal('nvr-recorder.stop-recording'),
  params: z.object({
    camera: sDeviceParam,
    streamId: z.string().nonempty(),
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
