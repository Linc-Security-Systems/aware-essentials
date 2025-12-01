import { z } from 'zod';

// COMMANDS

export const sDoorUnlockCommand = z.object({
  command: z.literal('door.unlock'),
  params: z.object({}),
});

export type DoorUnlockCommand = z.infer<typeof sDoorUnlockCommand>;

export const sDoorLockCommand = z.object({
  command: z.literal('door.lock'),
  params: z.object({}),
});

export type DoorLockCommand = z.infer<typeof sDoorLockCommand>;

export const sDoorReleaseCommand = z.object({
  command: z.literal('door.release'),
  params: z.object({}),
});

export type DoorReleaseCommand = z.infer<typeof sDoorReleaseCommand>;

export const sDoorAlarmAckCommand = z.object({
  command: z.literal('door.alarm-ack'),
  params: z.object({}),
});

export type DoorAlarmAckCommand = z.infer<typeof sDoorAlarmAckCommand>;

export const doorCommands = {
  'door.unlock': sDoorUnlockCommand,
  'door.lock': sDoorLockCommand,
  'door.release': sDoorReleaseCommand,
  'door.alarm-ack': sDoorAlarmAckCommand,
} as const;

export type DoorCommand =
  | DoorUnlockCommand
  | DoorLockCommand
  | DoorReleaseCommand
  | DoorAlarmAckCommand;
