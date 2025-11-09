import { z } from 'zod';

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
