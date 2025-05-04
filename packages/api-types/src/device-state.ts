import { AlarmStateDto } from './device/alarm';
import { CameraStateDto } from './device/camera';
import { CameraLiftStateDto } from './device/camera-lift';
import { DoorStateDto } from './device/door';
import { IntercomOperatorStateDto } from './device/intercom-operator';
import { IntercomTerminalStateDto } from './device/intercom-terminal';
import { IoBoardStateDto } from './device/io-board';
import { MotionSensorStateDto } from './device/motion-sensor';
import { PanicButtonStateDto } from './device/panic-button';

export type DeviceStateDto =
  | CameraStateDto
  | DoorStateDto
  | AlarmStateDto
  | IoBoardStateDto
  | CameraLiftStateDto
  | MotionSensorStateDto
  | PanicButtonStateDto
  | IntercomTerminalStateDto
  | IntercomOperatorStateDto;
