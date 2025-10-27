import { z } from 'zod';
import { CAMERA, sCameraSpecs } from './camera';
import { DOOR, sDoorSpecs } from './door';
import { IO_BOARD, sIoBoardSpecs } from './io-board';
import { CAMERA_LIFT, sCameraLiftSpecs } from './camera-lift';
import { MOTION_SENSOR, sMotionSensorSpecs } from './motion-sensor';
import { PANIC_BUTTON, sPanicButtonSpecs } from './panic-button';
import { INTERCOM_OPERATOR } from './intercom-operator';
import { INTERCOM_TERMINAL, sIntercomTerminalSpecs } from './intercom-terminal';
import { PBX, sPbxSpecs } from './pbx';
import { SERVER } from './server';
import { ALARM, sAlarmSpecs } from './alarm';
import { sDeviceRelationDto, sDeviceRelationSide } from '../device-relation';
import { DEVICE_GATEWAY } from './device-gateway';
import { PRESENCE_TRACKER } from './presence-tracker';
import { DISPLAY } from './display';
import { RECORDER, sRecorderSpecs } from './recorder';

export const DEVICE_TYPES = [
  ALARM,
  SERVER,
  CAMERA,
  DOOR,
  'reader',
  IO_BOARD,
  CAMERA_LIFT,
  MOTION_SENSOR,
  PANIC_BUTTON,
  INTERCOM_OPERATOR,
  INTERCOM_TERMINAL,
  PBX,
  DEVICE_GATEWAY,
  PRESENCE_TRACKER,
  DISPLAY,
  RECORDER,
] as const;

const sDeviceType = z.enum(DEVICE_TYPES);

const sAlarmSpecsWithType = sAlarmSpecs.merge(
  z.object({ type: z.literal(ALARM) }),
);
const sCameraSpecsWithType = sCameraSpecs.merge(
  z.object({ type: z.literal(CAMERA) }),
);
const sDoorSpecsWithType = sDoorSpecs.merge(
  z.object({ type: z.literal(DOOR) }),
);
const sIoBoardSpecsWithType = sIoBoardSpecs.merge(
  z.object({ type: z.literal(IO_BOARD) }),
);
const sCameraLiftSpecsWithType = sCameraLiftSpecs.merge(
  z.object({ type: z.literal(CAMERA_LIFT) }),
);
const sMotionSensorSpecsWithType = sMotionSensorSpecs.merge(
  z.object({ type: z.literal(MOTION_SENSOR) }),
);
const sPanicButtonSpecsWithType = sPanicButtonSpecs.merge(
  z.object({ type: z.literal(PANIC_BUTTON) }),
);
const sIntercomTerminalSpecsWithType = sIntercomTerminalSpecs.merge(
  z.object({ type: z.literal(INTERCOM_TERMINAL) }),
);
const sPbxSpecsWithType = sPbxSpecs.merge(z.object({ type: z.literal(PBX) }));
const sServerSpecsWithType = z.object({ type: z.literal(SERVER) });
const sIntercomOperatorSpecsWithType = z.object({
  type: z.literal(INTERCOM_OPERATOR),
});
const sDeviceGatewaySpecsWithType = z.object({
  type: z.literal(DEVICE_GATEWAY),
});
const sPresenceTrackerSpecsWithType = z.object({
  type: z.literal(PRESENCE_TRACKER),
});
const sReaderSpecsWithType = z.object({ type: z.literal('reader') });

export const sDisplaySpecsWithType = z.object({ type: z.literal(DISPLAY) });

export const sRecorderSpecsWithType = sRecorderSpecs.merge(
  z.object({ type: z.literal(RECORDER) }),
);

export const sAnyDeviceSpecs = z.discriminatedUnion('type', [
  sAlarmSpecsWithType,
  sCameraSpecsWithType,
  sDoorSpecsWithType,
  sIoBoardSpecsWithType,
  sCameraLiftSpecsWithType,
  sMotionSensorSpecsWithType,
  sPanicButtonSpecsWithType,
  sIntercomTerminalSpecsWithType,
  sPbxSpecsWithType,
  sServerSpecsWithType,
  sIntercomOperatorSpecsWithType,
  sDeviceGatewaySpecsWithType,
  sPresenceTrackerSpecsWithType,
  sReaderSpecsWithType,
  sDisplaySpecsWithType,
  sRecorderSpecsWithType,
]);

export const sProviderMetadata = z.object({}).catchall(z.unknown());

export const sPresetDto = z.object({
  id: z.string(),
  name: z.string(),
  params: z.unknown(),
  isDefault: z.boolean(),
  assignedRef: z.string().nullable(),
  createdOn: z.string().datetime(),
  lastModifiedOn: z.string().datetime(),
});

export const sDeviceMgmtInfo = z.object({
  id: z.string(),
  presets: z.array(sPresetDto),
  providerAssignedName: z.string().nonempty(),
  notes: z.string().nullable(),
  tags: z.array(z.string()),
  relations: z.array(sDeviceRelationSide),
  groups: z.array(z.string()),
  enabled: z.boolean(),
  createdOn: z.string().datetime(),
  lastModifiedOn: z.string().datetime(),
});

export const sForeignDeviceInfo = z.object({
  name: z.string(),
  foreignRef: z.string(),
  provider: z.string(),
  providerMetadata: sProviderMetadata,
});

export const sDeviceDto = sAnyDeviceSpecs
  .and(sDeviceMgmtInfo)
  .and(sForeignDeviceInfo);

export const sCameraDto = sCameraSpecsWithType
  .and(sDeviceMgmtInfo)
  .and(sForeignDeviceInfo);
export const sDoorDto = sDoorSpecsWithType
  .and(sDeviceMgmtInfo)
  .and(sForeignDeviceInfo);
export const sReaderDto = sReaderSpecsWithType
  .and(sDeviceMgmtInfo)
  .and(sForeignDeviceInfo);
export const sIoBoardDto = sIoBoardSpecsWithType
  .and(sDeviceMgmtInfo)
  .and(sForeignDeviceInfo);
export const sCameraLiftDto = sCameraLiftSpecsWithType
  .and(sDeviceMgmtInfo)
  .and(sForeignDeviceInfo);
export const sMotionSensorDto = sMotionSensorSpecsWithType
  .and(sDeviceMgmtInfo)
  .and(sForeignDeviceInfo);
export const sPanicButtonDto = sPanicButtonSpecsWithType
  .and(sDeviceMgmtInfo)
  .and(sForeignDeviceInfo);
export const sIntercomTerminalDto = sIntercomTerminalSpecsWithType
  .and(sDeviceMgmtInfo)
  .and(sForeignDeviceInfo);
export const sPbxDto = sPbxSpecsWithType
  .and(sDeviceMgmtInfo)
  .and(sForeignDeviceInfo);
export const sDeviceGatewayDto = sDeviceGatewaySpecsWithType
  .and(sDeviceMgmtInfo)
  .and(sForeignDeviceInfo);
export const sPresenceTrackerDto = sPresenceTrackerSpecsWithType
  .and(sDeviceMgmtInfo)
  .and(sForeignDeviceInfo);
export const sServerDto = sServerSpecsWithType
  .and(sDeviceMgmtInfo)
  .and(sForeignDeviceInfo);
export const sAlarmDto = sAlarmSpecsWithType
  .and(sDeviceMgmtInfo)
  .and(sForeignDeviceInfo);
export const sIntercomOperatorDto = sIntercomOperatorSpecsWithType
  .and(sDeviceMgmtInfo)
  .and(sForeignDeviceInfo);
export const sDisplayDto = sDisplaySpecsWithType
  .and(sDeviceMgmtInfo)
  .and(sForeignDeviceInfo);
export const sRecorderDto = sRecorderSpecsWithType
  .and(sDeviceMgmtInfo)
  .and(sForeignDeviceInfo);

export const sAddDeviceRequest = z.object({
  name: z.string().nonempty(),
  foreignRef: z.string().nonempty(),
  notes: z.string().nullable(),
  provider: z.string().nonempty(),
  providerMetadata: sProviderMetadata,
  tags: z.array(z.string().nonempty()),
  relations: z.array(sDeviceRelationSide),
  type: sDeviceType,
  specs: z.object({}).catchall(z.unknown()).optional(),
});

export const sUpdateDeviceRequest = z.object({
  id: z.string().nonempty(),
  name: z.string().optional(),
  notes: z.string().nullable().optional(),
  providerMetadata: z.object({}).catchall(z.unknown()).optional(),
  specs: z.object({}).catchall(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  relations: z.array(sDeviceRelationSide).optional(),
  enabled: z.boolean().optional(),
});

export const sOverrideDeviceSpecsRequest = z.object({
  id: z.string(),
  specs: z.object({}).catchall(z.unknown()),
});

export const sAddDevicePresetRequest = z.object({
  name: z.string().nonempty(),
  params: z.object({}).catchall(z.unknown()),
  assignedRef: z.string().nullable(),
  isDefault: z.boolean(),
  deviceId: z.string().nonempty(),
});

export const sUpdateDevicePresetRequest = z.object({
  name: z.string().optional(),
  isDefault: z.boolean().optional(),
  assignedRef: z.string().nullable().optional(),
  deviceId: z.string().nonempty(),
  presetId: z.string().nonempty(),
});

export const sRemoveDevicePresetRequest = z.object({
  deviceId: z.string().nonempty(),
  presetId: z.string().nonempty(),
});

export const sEventVariantDescription = z.object({
  name: z.string().describe('The name of the variant'),
  label: z.string().describe('A human-readable label for the variant'),
});

export const sEventDescription = z.object({
  kind: z.string().describe('The kind of event'),
  label: z.string().describe('A human-readable label for the event'),
  variants: z
    .array(sEventVariantDescription)
    .optional()
    .describe('Possible variants derived from event data'),
});

export const sGetEventCatalogResponse = z.array(sEventDescription);

export const sSetUnsetRelationRequest = sDeviceRelationDto;

export type DeviceType = z.infer<typeof sDeviceType>;

export type PresetDto = z.infer<typeof sPresetDto>;

export type DeviceDto = z.infer<typeof sDeviceDto>;

export type CameraDto = z.infer<typeof sCameraDto>;
export type DoorDto = z.infer<typeof sDoorDto>;
export type ReaderDto = z.infer<typeof sReaderDto>;
export type IoBoardDto = z.infer<typeof sIoBoardDto>;
export type CameraLiftDto = z.infer<typeof sCameraLiftDto>;
export type MotionSensorDto = z.infer<typeof sMotionSensorDto>;
export type PanicButtonDto = z.infer<typeof sPanicButtonDto>;
export type IntercomTerminalDto = z.infer<typeof sIntercomTerminalDto>;
export type PbxDto = z.infer<typeof sPbxDto>;
export type DeviceGatewayDto = z.infer<typeof sDeviceGatewayDto>;
export type PresenceTrackerDto = z.infer<typeof sPresenceTrackerDto>;
export type ServerDto = z.infer<typeof sServerDto>;
export type AlarmDto = z.infer<typeof sAlarmDto>;
export type IntercomOperatorDto = z.infer<typeof sIntercomOperatorDto>;
export type DisplayDto = z.infer<typeof sDisplayDto>;
export type RecorderDto = z.infer<typeof sRecorderDto>;

export type AddDeviceRequest = z.infer<typeof sAddDeviceRequest>;

export type UpdateDeviceRequest = z.infer<typeof sUpdateDeviceRequest>;

export type OverrideDeviceSpecsRequest = z.infer<
  typeof sOverrideDeviceSpecsRequest
>;

export type AddDevicePresetRequest = z.infer<typeof sAddDevicePresetRequest>;

export type UpdateDevicePresetRequest = z.infer<
  typeof sUpdateDevicePresetRequest
>;

export type RemoveDevicePresetRequest = z.infer<
  typeof sRemoveDevicePresetRequest
>;

export type SetUnsetDeviceRelationRequest = z.infer<
  typeof sSetUnsetRelationRequest
>;

export type DeviceSearchCriteria = {
  type: DeviceType;
};

export type EventDescription = z.infer<typeof sEventDescription>;

export type EventVariantDescription = z.infer<typeof sEventVariantDescription>;

export type GetEventCatalogResponse = z.infer<typeof sGetEventCatalogResponse>;
