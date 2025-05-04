import { z } from 'zod';
import { AlarmEvent, alarmEventSchemasByKind } from './device/alarm';
import { CameraEvent, cameraEventSchemasByKind } from './device/camera';
import { DeviceGatewayEvent } from './device/device-gateway';
import { DoorEvent, doorEventSchemaByKind } from './device/door';
import {
  IntercomTerminalEvent,
  intercomTerminalEventSchemaByKind,
} from './device/intercom-terminal';
import { IoBoardEvent, ioBoardEventSchemaByKind } from './device/io-board';
import {
  PanicButtonEvent,
  panicButtonEventSchemaByKind,
} from './device/panic-button';
import {
  PresenceTrackerEvent,
  presenceTrackerEventSchemaByKind,
} from './device/presence-tracker';
import { ReaderEvent, readerEventSchemaByKind } from './device/reader/index';
import { ServerEvent } from './device/server';

export interface DeviceCommandTriggered {
  kind: 'device-command';
  userId?: string;
  command: string;
  args: object;
}

export interface MotionDetectedEvent {
  kind: 'motion-detected';
}

export interface DeviceConnectedEvent {
  kind: 'device-connected';
  clientId?: number; // for soft devices
}

export interface DeviceDisconnectedEvent {
  kind: 'device-disconnected';
  clientId?: number;
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
  | IntercomTerminalEvent
  | ServerEvent
  | DeviceGatewayEvent
  | PresenceTrackerEvent
  | IoBoardEvent;

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
  'intercom-call': 'Intercom Call',
  'intercom-call-answered': 'Intercom Call Answered',
  'intercom-call-ended': 'Intercom Call Ended',
  'intercom-call-cancelled': 'Intercom Call Cancelled',
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

export interface EventSearchQueryDto {
  deviceId?: string[];
  kind?: string[];
  userId?: string[];
  personId?: string[];
  timeFrom?: number;
  timeTo?: number;
  offset?: number;
  limit?: number;
  alarmTriggersOnly?: boolean;
}

export type EventSearchItemDto<TEvent extends AnyDeviceEvent = AnyDeviceEvent> =
  {
    id: string;
    timestamp: number;
    deviceId?: string;
    observedBy?: string;
    alarmId: string | null;
  } & TEvent;
