import { sDeviceEvent, sDeviceId, sDuration } from 'src/primitives';
import { z } from 'zod';

/*
- only one alarm is active at the same time. If a new alarm-causing event takes place, the already existing alarm will be amended with the new event rather than creating a new alarm
  (Imagine the case of pirates boarding a ship: the alarm will not be triggered for each pirate, but only once for the whole group of pirates so the UI will show one alarm window and all devices that triggered that alarm listed as they come in, each with its adjacent camera footage if applicable)
- alarms are triggered by events only, so each alarm MUST correspond to one or more events (we shall call those 'alarm triggers')
- upon arming the system, events like 'door-access', 'motion-detected' etc. would trigger an alarm
- in all situations, 'door-force', 'tamper' and other unusual events will trigger alarms regardless of their arm / disarm states
- arming / disarming more than one device will be achieved by an action against a device group (e.g. 'All Devices', 'Top Deck Doors', 'All Doors', 'All Motion Detectors' etc.)
*/

export const ALARM = 'alarm' as const;

// SPECS

export const sAlarmSpecs = z.object({});

export type AlarmSpecs = z.infer<typeof sAlarmSpecs>;

// COMMANDS

export const sArmCommand = z.object({
  command: z.literal('alarm.arm'),
  params: z.object({
    deviceId: sDeviceId,
  }),
});

export type ArmCommand = z.infer<typeof sArmCommand>;

export const sDisarmCommand = z.object({
  command: z.literal('alarm.disarm'),
  params: z.object({
    deviceId: sDeviceId,
    duration: sDuration.optional().describe('Duration in milliseconds'),
  }),
});

export type DisarmCommand = z.infer<typeof sDisarmCommand>;

export const sBypassCommand = z.object({
  command: z.literal('alarm.bypass'),
  params: z.object({
    deviceId: sDeviceId,
  }),
});

export type BypassCommand = z.infer<typeof sBypassCommand>;

export const sUnbypassCommand = z.object({
  command: z.literal('alarm.unbypass'),
  params: z.object({
    deviceId: sDeviceId,
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

// STATE

export type AlarmStateDto = {
  activeAlarmId: string | null;
  triggeredOn: number | null;
  // event IDs triggering the alarm
  triggeredBy: string[];
  // map of device IDs to their alarm state (armed / disarmed)
  armed: Record<string, boolean>;
  bypassList: string[];
};

// EVENTS

export const sAlarmTriggeredEvent = z.object({
  kind: z.literal('alarm-triggered'),
  alarmId: z.string().nonempty(),
});

export const sAlarmAcknowledgedEvent = z.object({
  kind: z.literal('alarm-acknowledged'),
  alarmId: z.string().nonempty(),
  userId: z.string().optional(),
  personId: z.string().optional(),
});

export const sAlarmArmedAllEvent = z.object({
  kind: z.literal('alarm-armed-all'),
  userId: z.string().optional(),
  personId: z.string().optional(),
});

export const sAlarmDisarmedAllEvent = z.object({
  kind: z.literal('alarm-disarmed-all'),
  userId: z.string().optional(),
  personId: z.string().optional(),
});

export const sAlarmArmedEvent = z.object({
  kind: z.literal('alarm-armed'),
  subjects: z.array(z.string().nonempty()),
  userId: z.string().optional(),
  personId: z.string().optional(),
});

export const sAlarmDisarmedEvent = z.object({
  kind: z.literal('alarm-disarmed'),
  subjects: z.array(z.string().nonempty()),
  userId: z.string().optional(),
  personId: z.string().optional(),
});

export const sAlarmArmReleasedEvent = z.object({
  kind: z.literal('alarm-arm-released'),
  userId: z.string().optional(),
  personId: z.string().optional(),
});

export const sAlarmRearmedEvent = z.object({
  kind: z.literal('alarm-rearmed'),
});

export const alarmEventSchemasByKind = {
  'alarm-triggered': sAlarmTriggeredEvent,
  'alarm-acknowledged': sAlarmAcknowledgedEvent,
  'alarm-armed-all': sAlarmArmedAllEvent,
  'alarm-disarmed-all': sAlarmDisarmedAllEvent,
  'alarm-armed': sAlarmArmedEvent,
  'alarm-disarmed': sAlarmDisarmedEvent,
  'alarm-arm-released': sAlarmArmReleasedEvent,
  'alarm-rearmed': sAlarmRearmedEvent,
} as const;

export type AlarmTriggeredEvent = z.infer<typeof sAlarmTriggeredEvent>;
export type AlarmAcknowledgedEvent = z.infer<typeof sAlarmAcknowledgedEvent>;
export type AlarmArmedAllEvent = z.infer<typeof sAlarmArmedAllEvent>;
export type AlarmDisarmedAllEvent = z.infer<typeof sAlarmDisarmedAllEvent>;
export type AlarmArmedEvent = z.infer<typeof sAlarmArmedEvent>;
export type AlarmDisarmedEvent = z.infer<typeof sAlarmDisarmedEvent>;
export type AlarmArmReleasedEvent = z.infer<typeof sAlarmArmReleasedEvent>;
export type AlarmRearmedEvent = z.infer<typeof sAlarmRearmedEvent>;

export type AlarmEvent =
  | AlarmTriggeredEvent
  | AlarmAcknowledgedEvent
  | AlarmArmedAllEvent
  | AlarmDisarmedAllEvent
  | AlarmArmedEvent
  | AlarmDisarmedEvent
  | AlarmArmReleasedEvent
  | AlarmRearmedEvent;
