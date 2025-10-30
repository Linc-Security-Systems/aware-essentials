import { AlarmCommand, alarmCommandSchemas } from './device/alarm';
import { CameraCommand, cameraCommands } from './device/camera';
import { CameraLiftCommand, cameraLiftCommands } from './device/camera-lift';
import { DeviceGatewayCommand } from './device/device-gateway';
import { DisplayCommand, displayCommands } from './device/display';
import { DoorCommand, doorCommands } from './device/door';
import { IntercomTerminalCommand } from './device/intercom-terminal';
import { IoBoardCommand, ioBoardCommands } from './device/io-board';
import {
  NvrExporterCommand,
  nvrExporterCommandSchemas,
} from './device/nvr-exporter';
import { PbxCommand, pbxCommands } from './device/pbx';
import {
  PresenceTrackerCommand,
  presenceTrackerCommands,
} from './device/presence-tracker';
import { ReaderCommand } from './device/reader/index';
import { ServerCommand } from './device/server';
import { PermissionId } from './permissions';

export type AnyDeviceCommand =
  | ServerCommand
  | DeviceGatewayCommand
  | CameraCommand
  | DoorCommand
  | ReaderCommand
  | IoBoardCommand
  | CameraLiftCommand
  | AlarmCommand
  | IntercomTerminalCommand
  | PbxCommand
  | PresenceTrackerCommand
  | DisplayCommand
  | NvrExporterCommand;

export type CommandRun<TCommand extends AnyDeviceCommand = AnyDeviceCommand> = {
  timestamp: number;
  requestId: string;
  deviceId: string;
  senderId?: number;
} & TCommand;

export const commandSchemas = {
  ...alarmCommandSchemas,
  ...cameraCommands,
  ...cameraLiftCommands,
  ...doorCommands,
  ...ioBoardCommands,
  ...pbxCommands,
  ...presenceTrackerCommands,
  ...displayCommands,
  ...nvrExporterCommandSchemas,
} as const;

export const commandDescriptions: Record<
  AnyDeviceCommand['command'],
  { description: string; permission: PermissionId }
> = {
  'camera.ptz-set': { description: 'PTZ Set', permission: 'camera:ptz' },
  'camera.ptz-move': { description: 'PTZ Move', permission: 'camera:ptz' },
  'camera.ptz-begin-move': {
    description: 'PTZ Begin Move',
    permission: 'camera:ptz',
  },
  'camera.ptz-end-move': {
    description: 'PTZ End Move',
    permission: 'camera:ptz',
  },
  'camera.enable': {
    description: 'Camera Enable',
    permission: 'camera:privacy-mode',
  },
  'camera.disable': {
    description: 'Camera Disable',
    permission: 'camera:privacy-mode',
  },
  'camera.enable-detection': {
    description: 'Camera Enable Detection',
    permission: 'camera:detection',
  },
  'camera.disable-detection': {
    description: 'Camera Disable Detection',
    permission: 'camera:detection',
  },
  'door.unlock': { description: 'Door Unlock', permission: 'door:lock' },
  'door.lock': { description: 'Door Lock', permission: 'door:lock' },
  'door.release': { description: 'Door Release', permission: 'door:release' },
  'door.alarm-ack': {
    description: 'Door Alarm Acknowledge',
    permission: 'alarm:acknowlede',
  },
  'io-board.set-output': {
    description: 'IO board Set Output',
    permission: 'io-board:activate',
  },
  'camera-lift.raise': {
    description: 'Camera Lift Raise',
    permission: 'camera-lift:activate',
  },
  'camera-lift.lower': {
    description: 'Camera Lift Lower',
    permission: 'camera-lift:activate',
  },
  'alarm.acknowledge': {
    description: 'Alarm Acknowledge',
    permission: 'alarm:acknowlede',
  },
  'alarm.arm': { description: 'Device Arm', permission: 'alarm:arm' },
  'alarm.arm-all': { description: 'Device Arm All', permission: 'alarm:arm' },
  'alarm.disarm': { description: 'Device Disarm', permission: 'alarm:arm' },
  'alarm.disarm-all': {
    description: 'Device Disarm All',
    permission: 'alarm:arm',
  },
  'alarm.bypass': {
    description: 'Alarm Bypass',
    permission: 'alarm:bypass',
  },
  'alarm.unbypass': {
    description: 'Alarm Unbypass',
    permission: 'alarm:bypass',
  },
  'alarm.set-trigger': {
    description: 'Alarm Trigger',
    permission: 'alarm:trigger',
  },
  'intercom-terminal.dial': {
    description: 'Intercom Call',
    permission: 'intercom:read',
  },
  'intercom-terminal.cancel-call': {
    description: 'Intercom Call Cancel',
    permission: 'intercom:read',
  },
  'intercom-terminal.answer': {
    description: 'Intercom Call Answer',
    permission: 'intercom:read',
  },
  'intercom-terminal.hang-up': {
    description: 'Intercom Call End',
    permission: 'intercom:read',
  },
  'intercom-terminal.connect': {
    description: 'Intercom Terminal Connect',
    permission: 'intercom:read',
  },
  'intercom-terminal.disconnect': {
    description: 'Intercom Terminal Disconnect',
    permission: 'intercom:read',
  },
  'pbx.call': {
    description: 'Automated Phone Call',
    permission: 'intercom:read',
  },
  'camera.preset-activate': {
    description: 'Camera Preset Activate',
    permission: 'preset:read',
  },
  'camera.preset-delete': {
    description: 'Camera Preset Delete',
    permission: 'preset:delete',
  },
  'camera.preset-save': {
    description: 'Camera Preset Save',
    permission: 'preset:update',
  },
  'presence-tracker.check-in': {
    description: 'Person Check In',
    permission: 'presence:update',
  },
  'presence-tracker.check-out': {
    description: 'Person Check Out',
    permission: 'presence:update',
  },
  'presence-tracker.toggle-presence': {
    description: 'Person Toggle Presence',
    permission: 'presence:update',
  },
  'server.run-macro': { description: 'Run Macro', permission: 'macro:run' },
  'display.set-view': {
    description: 'Display Set View',
    permission: 'display:read',
  },
  'nvr-exporter.start-export': {
    description: 'NVR Exporter Start Export',
    permission: 'camera:playback-export',
  },
  'nvr-exporter.delete-export': {
    description: 'NVR Exporter Delete Export',
    permission: 'camera:playback-export',
  },
};
