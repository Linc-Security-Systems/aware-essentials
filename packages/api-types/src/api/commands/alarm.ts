import { sDeviceEvent, sDeviceId, sDuration } from '../../primitives';
import { z } from 'zod';

// COMMANDS

export const sArmCommand = z.object({
  command: z.literal('alarm.arm'),
  params: z.object({
    deviceIds: z.array(sDeviceId),
  }),
});

export type ArmCommand = z.infer<typeof sArmCommand>;

export const sDisarmCommand = z.object({
  command: z.literal('alarm.disarm'),
  params: z.object({
    deviceIds: z.array(sDeviceId),
    duration: sDuration.optional().describe('Duration in milliseconds'),
  }),
});

export type DisarmCommand = z.infer<typeof sDisarmCommand>;

export const sBypassCommand = z.object({
  command: z.literal('alarm.bypass'),
  params: z.object({
    deviceIds: z.array(sDeviceId),
  }),
});

export type BypassCommand = z.infer<typeof sBypassCommand>;

export const sUnbypassCommand = z.object({
  command: z.literal('alarm.unbypass'),
  params: z.object({
    deviceIds: z.array(sDeviceId),
  }),
});

export type UnbypassCommand = z.infer<typeof sUnbypassCommand>;

export const sArmAllCommand = z.object({
  command: z.literal('alarm.arm-all'),
  params: z.object({}),
});

export type ArmAllCommand = z.infer<typeof sArmAllCommand>;

export const sDisarmAllCommand = z.object({
  command: z.literal('alarm.disarm-all'),
  params: z.object({
    duration: sDuration.optional().describe('Duration in milliseconds'),
  }),
});

export type DisarmAllCommand = z.infer<typeof sDisarmAllCommand>;

export const sAcknowledgeCommand = z.object({
  command: z.literal('alarm.acknowledge'),
  params: z.object({}),
});

export type AcknowledgeCommand = z.infer<typeof sAcknowledgeCommand>;

export const sSetTriggerCommand = z.object({
  command: z.literal('alarm.set-trigger'),
  params: z.object({
    event: sDeviceEvent,
    onlyIfArmed: z.boolean().describe('Set only if the device is armed'),
  }),
});

export type SetTriggerCommand = z.infer<typeof sSetTriggerCommand>;

export type AlarmCommand =
  | ArmCommand
  | DisarmCommand
  | ArmAllCommand
  | DisarmAllCommand
  | AcknowledgeCommand
  | SetTriggerCommand
  | BypassCommand
  | UnbypassCommand;

export const alarmCommandSchemas = {
  'alarm.arm': sArmCommand,
  'alarm.disarm': sDisarmCommand,
  'alarm.arm-all': sArmAllCommand,
  'alarm.disarm-all': sDisarmAllCommand,
  'alarm.acknowledge': sAcknowledgeCommand,
  'alarm.set-trigger': sSetTriggerCommand,
  'alarm.bypass': sBypassCommand,
  'alarm.unbypass': sUnbypassCommand,
} as const;
