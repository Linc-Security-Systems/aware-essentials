import { z } from 'zod';
import { DeviceEvent } from './api/events';
import { DeviceType } from './objects/device';
import { worldObjects } from './objects/world-object';
import { AutomationRuleBody } from './objects/automation-rule';

export const sAlarmBehavior = z.enum([
  'ignore',
  'trigger-always',
  'trigger-when-armed',
]);

export const sAlarmAutomationLevel = z.enum(['by-device', 'by-type']);

export const sAlarmAutomationCriteria = z.object({
  field: z.string().describe('The field to match'),
  value: z.unknown().describe('The value to match'),
});

export const sAlarmAutomationMetadata = z.object({
  behavior: sAlarmBehavior,
  level: sAlarmAutomationLevel,
  eventKind: z.string().describe('The kind of event to match'),
  eventVariant: z
    .string()
    .nullable()
    .describe('Optional variant for specific device events'),
  eventCriteria: z.array(sAlarmAutomationCriteria),
});

export type AlarmBehavior = z.infer<typeof sAlarmBehavior>;

export type AlarmAutomationLevel = z.infer<typeof sAlarmAutomationLevel>;

export type AlarmAutomationMetadata = z.infer<typeof sAlarmAutomationMetadata>;

export type AlarmAutomationCriteria = z.infer<typeof sAlarmAutomationCriteria>;

export const isAlarmAutomationMetadata = (
  metadata: unknown,
): metadata is AlarmAutomationMetadata => {
  if (typeof metadata !== 'object' || metadata === null) {
    return false;
  }
  const parsed = sAlarmAutomationMetadata.safeParse(metadata);
  return parsed.success;
};

// Alarm assigns automation rules with code that is either:
// [by-event]:[event-kind]
// [by-device]:[device-id]
export const formatByDeviceAutomationCode = (
  eventKind: DeviceEvent['kind'],
  deviceId: string,
  variant: string | null = null,
): string => {
  return `by-device:${deviceId}:${eventKind}${variant ? `:${variant}` : ''}`;
};

export const formatByTypeAutomationCode = (
  eventKind: DeviceEvent['kind'],
  deviceType: DeviceType,
  variant: string | null = null,
): string => {
  return `by-type:${deviceType}:${eventKind}${variant ? `:${variant}` : ''}`;
};

export const isByDeviceAutomationCode = (code: string): boolean => {
  return code.startsWith('by-device:');
};

export const isByTypeAutomationCode = (code: string): boolean => {
  return code.startsWith('by-type:');
};

export type ParsedByDeviceAutomationCode = {
  type: 'by-device';
  value: string;
  eventKind: DeviceEvent['kind'];
  eventVariant: string | null; // Optional variant for specific device events
};

export type ParsedByTypeAutomationCode = {
  type: 'by-type';
  value: DeviceType;
  eventKind: DeviceEvent['kind'];
  eventVariant: string | null; // Optional variant for specific device events
};

export type ParsedAlarmAutomationCode =
  | ParsedByDeviceAutomationCode
  | ParsedByTypeAutomationCode;

export const parseAlarmAutomationCode = (
  code: string,
): ParsedAlarmAutomationCode | null => {
  if (isByDeviceAutomationCode(code)) {
    const parts = code.replace('by-device:', '').split(':');
    if (parts.length < 2) {
      return null; // Invalid format
    }
    return {
      type: 'by-device',
      value: parts[0], // deviceId
      eventKind: parts[1] as DeviceEvent['kind'], // eventKind
      eventVariant: parts[2] || null, // Optional variant for specific device events
    };
  }
  if (isByTypeAutomationCode(code)) {
    const parts = code.replace('by-type:', '').split(':');
    if (parts.length < 2) {
      return null; // Invalid format
    }
    return {
      type: 'by-type',
      value: parts[0] as DeviceType, // deviceType
      eventKind: parts[1] as DeviceEvent['kind'], // eventKind
      eventVariant: parts[2] || null, // Optional variant for specific device events
    };
  }
  return null;
};

const encodeValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return `${JSON.stringify(value)}`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${String(value)}`;
  }
  if (Array.isArray(value)) {
    return `(${value.map(encodeValue).join(', ')})`;
  }
  if (value === null) {
    return 'null';
  }
  throw new Error(`Unsupported value type for: ${typeof value}`);
};

const encodeComparison = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `in ${encodeValue(value)}`;
  }
  return `== ${encodeValue(value)}`;
};

export const createAlarmRuleBody = (
  eventKind: DeviceEvent['kind'],
  behavior: AlarmBehavior,
  deviceType: DeviceType,
  eventCriteria: AlarmAutomationMetadata['eventCriteria'],
  deviceId?: string,
): AutomationRuleBody => {
  let runIf = 'source.type == "' + deviceType + '"';
  if (deviceId) {
    runIf += ` and source.id == "${deviceId}"`;
  }
  for (const criterion of eventCriteria) {
    runIf += ` and event.${criterion.field} ${encodeComparison(criterion.value)}`;
  }
  return {
    onEvent: eventKind,
    runIf,
    commands:
      behavior === 'ignore'
        ? []
        : [
            {
              command: 'alarm.set-trigger',
              target: 'target.type =="alarm"',
              params: {
                event: '{{event}}',
                onlyIfArmed: behavior === 'trigger-when-armed',
              },
            },
          ],
  };
};

export const resolveAlarmExclusivityGroup = (deviceType: DeviceType) =>
  `alarm-${deviceType}`;

export type DeviceEventVariant = {
  name: string;
  label: string;
  criteria: AlarmAutomationCriteria[];
};

const sorted = (specs: DeviceEventVariant[]) => {
  return specs.sort((a, b) => a.label.localeCompare(b.label));
};

export const alarmEventVariants = {
  'door-access': sorted([
    {
      name: 'allowed',
      label: 'Door Access Granted',
      criteria: [{ field: 'allowed', value: true }],
    },
    {
      name: 'denied',
      label: 'Door Access Denied',
      criteria: [{ field: 'allowed', value: false }],
    },
  ]),
  'object-detection-started': sorted([
    // TODO - add criteria for object detection started
    ...worldObjects.map((object) => ({
      name: object.id,
      label: `${object.label} Detected`,
      criteria: [{ field: 'objectKind', value: object.id }],
    })),
  ]),
  'object-detection-ended': [],
  'object-detection-updated': [],
  'scene-created': [],
  'scene-updated': [],
  'scene-ended': [],
  'ptz-preset-saved': [],
} satisfies Partial<Record<DeviceEvent['kind'], DeviceEventVariant[]>>;
