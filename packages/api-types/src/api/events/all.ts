import { z } from 'zod';
import { AlarmEvent, alarmEventSchemasByKind } from './alarm';
import { CameraEvent, cameraEventSchemasByKind } from './camera';
import { DoorEvent, doorEventSchemaByKind } from './door';
import {
  IntercomTerminalEvent,
  intercomTerminalEventSchemaByKind,
} from './intercom-terminal';
import { IoBoardEvent, ioBoardEventSchemaByKind } from './io-board';
import { PanicButtonEvent, panicButtonEventSchemaByKind } from './panic-button';
import {
  PresenceTrackerEvent,
  presenceTrackerEventSchemaByKind,
} from './presence-tracker';
import { ReaderEvent, readerEventSchemaByKind } from './reader';
import { ServerEvent } from './server';
import {
  NvrExporterEvent,
  nvrExporterEventSchemasByKind,
} from './nvr-exporter';
import { DeviceType } from '../../objects/device';
import { NotificationSeverity } from '../../primitives';

export const sDeviceCommandTriggered = z.object({
  kind: z.literal('device-command'),
  userId: z.string().nonempty().optional(),
  command: z.string().nonempty(),
  args: z.record(z.unknown()),
});

export type DeviceCommandTriggered = z.infer<typeof sDeviceCommandTriggered>;

export const sMotionDetected = z.object({
  kind: z.literal('motion-detected'),
});

export type MotionDetectedEvent = z.infer<typeof sMotionDetected>;

export const sDeviceConnectedEvent = z.object({
  kind: z.literal('device-connected'),
  clientId: z.number().int().positive().optional(),
});

export type DeviceConnectedEvent = z.infer<typeof sDeviceConnectedEvent>;

export const sDeviceDisconnectedEvent = z.object({
  kind: z.literal('device-disconnected'),
  clientId: z.number().int().positive().optional(),
});

export type DeviceDisconnectedEvent = z.infer<typeof sDeviceDisconnectedEvent>;

export interface NotificationCreatedEvent {
  kind: 'notification-created';
  notificationId: string;
  message: string;
  severity: NotificationSeverity;
  metadata: Record<string, unknown>;
  notificationRef: string | null;
  recipientId: string | null;
}

export interface NotificationAcknowledgedEvent {
  kind: 'notification-acknowledged';
  notificationId: string;
}

// DEVICE EVENTS

export type AnyDeviceEvent =
  | DeviceCommandTriggered
  | CameraEvent
  | DoorEvent
  | AlarmEvent
  | MotionDetectedEvent
  | ReaderEvent
  | PanicButtonEvent
  | DeviceConnectedEvent
  | DeviceDisconnectedEvent
  | NotificationCreatedEvent
  | NotificationAcknowledgedEvent
  | IntercomTerminalEvent
  | ServerEvent
  | PresenceTrackerEvent
  | IoBoardEvent
  | NvrExporterEvent;

export const sEventHeader = z.object({
  id: z.string().nonempty(),
  timestamp: z.number().int().positive(),
  deviceId: z.string().nonempty(),
  observedBy: z.string().optional(),
});

type EventHeader = z.infer<typeof sEventHeader>;

export type DeviceEvent<TEvent extends AnyDeviceEvent = AnyDeviceEvent> =
  EventHeader & TEvent;

export const eventKindLabels: Record<DeviceEvent['kind'], string> = {
  'door-access': 'Door Access',
  'door-force': 'Force-Opened',
  'door-tamper': 'Tampered',
  'door-left-open': 'Left Open',
  'alarm-triggered': 'Alarm Triggered',
  'alarm-acknowledged': 'Alarm Acknowledged',
  'door-relock': 'Relocked',
  'door-mains-failed': 'Mains Failed',
  'door-acu-not-responding': 'ACU Not Responding',
  'door-acu-online': 'ACU Online',
  'door-mains-restored': 'Mains Restored',
  'door-tamper-restored': 'Tamper Restored',
  'motion-detected': 'Motion Detected',
  'device-command': 'Device Command',
  'reader-auth': 'Reader Authorized',
  'alarm-arm-released': 'Alarm Arm Released',
  'alarm-rearmed': 'Alarm Rearmed',
  'alarm-armed': 'Alarm Armed',
  'alarm-disarmed': 'Alarm Disarmed',
  'alarm-armed-all': 'Alarm Armed All',
  'alarm-disarmed-all': 'Alarm Disarmed All',
  'panic-button-pressed': 'Panic Button Pressed',
  'device-connected': 'Device Connected',
  'device-disconnected': 'Device Disconnected',
  'call-state-changed': 'Call State Changed',
  'object-created': 'Object Created',
  'object-updated': 'Object Updated',
  'object-deleted': 'Object Deleted',
  'ptz-preset-saved': 'PTZ Preset Saved on Device',
  'person-in': 'Person Checked In',
  'person-out': 'Person Checked Out',
  'object-detection-started': 'Object Detection Started',
  'object-detection-updated': 'Object Detection Updated',
  'object-detection-ended': 'Object Detection Ended',
  'scene-created': 'Scene Created',
  'scene-updated': 'Scene Updated',
  'scene-ended': 'Scene Ended',
  'io-board-input-changed': 'IO Board Input Changed',
  'agent-started': 'Agent Started',
  'agent-stopped': 'Agent Stopped',
  'door-opened': 'Door Opened',
  'door-closed': 'Door Closed',
  'nvr-export-started': 'NVR Export Started',
  'nvr-export-deleted': 'NVR Export Deleted',
  'notification-created': 'Notification Created',
  'notification-acknowledged': 'Notification Acknowledged',
  'user-logged-in': 'User Logged In',
  'user-logged-out': 'User Logged Out',
};

export const eventSchemaByKind = {
  ...alarmEventSchemasByKind,
  ...cameraEventSchemasByKind,
  ...doorEventSchemaByKind,
  ...intercomTerminalEventSchemaByKind,
  ...ioBoardEventSchemaByKind,
  ...panicButtonEventSchemaByKind,
  ...presenceTrackerEventSchemaByKind,
  ...readerEventSchemaByKind,
  ...nvrExporterEventSchemasByKind,
  'motion-detected': sMotionDetected,
  'device-command': sDeviceCommandTriggered,
  'device-connected': sDeviceConnectedEvent,
  'device-disconnected': sDeviceDisconnectedEvent,
};

export const eventsByDeviceType: Partial<
  Record<DeviceType, DeviceEvent['kind'][]>
> = {
  camera: [
    ...(Object.keys(cameraEventSchemasByKind) as DeviceEvent['kind'][]),
    'motion-detected' as const,
  ],
  door: Object.keys(doorEventSchemaByKind) as DeviceEvent['kind'][],
  'io-board': Object.keys(ioBoardEventSchemaByKind) as DeviceEvent['kind'][],
  'panic-button': Object.keys(
    panicButtonEventSchemaByKind,
  ) as DeviceEvent['kind'][],
  'presence-tracker': Object.keys(
    presenceTrackerEventSchemaByKind,
  ) as DeviceEvent['kind'][],
  reader: Object.keys(readerEventSchemaByKind) as DeviceEvent['kind'][],
  'motion-sensor': ['motion-detected' as const],
  'nvr-exporter': Object.keys(
    nvrExporterEventSchemasByKind,
  ) as DeviceEvent['kind'][],
};

export const isDeviceEvent = (event: unknown): event is AnyDeviceEvent => {
  if (typeof event !== 'object' || event === null) return false;
  if (!('kind' in event)) return false;
  if (typeof event.kind !== 'string') return false;
  const schema =
    eventSchemaByKind[event.kind as keyof typeof eventSchemaByKind];
  if (!schema) return false;
  const result = schema.safeParse(event);
  if (!result.success) return false;
  return true;
};
