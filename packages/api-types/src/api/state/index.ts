import { AlarmStateDto } from '../../objects/device/alarm';
import { CameraStateDto } from '../../objects/device/camera';
import { CameraLiftStateDto } from '../../objects/device/camera-lift';
import { DoorStateDto } from '../../objects/device/door';
import { IntercomOperatorStateDto } from '../../objects/device/intercom-operator';
import { IntercomTerminalStateDto } from '../../objects/device/intercom-terminal';
import { IoBoardStateDto } from '../../objects/device/io-board';
import { MotionSensorStateDto } from '../../objects/device/motion-sensor';
import { PanicButtonStateDto } from '../../objects/device/panic-button';

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
