import { z } from 'zod';
import { DeviceEvent } from './device-event';
import { DeviceType } from './device';
import { AutomationRuleBody } from './automation';

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
  eventKind: z.string().optional().describe('The kind of event to match'),
  eventCriteria: z.array(sAlarmAutomationCriteria),
});

export type AlarmBehavior = z.infer<typeof sAlarmBehavior>;

export type AlarmAutomationLevel = z.infer<typeof sAlarmAutomationLevel>;

export type AlarmAutomationMetadata = z.infer<typeof sAlarmAutomationMetadata>;

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
export const formatByDeviceAutomationCode = (deviceId: string): string => {
  return `by-device:${deviceId}`;
};

export const formatByTypeAutomationCode = (
  eventKind: DeviceEvent['kind'],
): string => {
  return `by-Type:${eventKind}`;
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
};

export type ParsedByTypeAutomationCode = {
  type: 'by-type';
  value: DeviceEvent['kind'];
};

export type ParsedAlarmAutomationCode =
  | ParsedByDeviceAutomationCode
  | ParsedByTypeAutomationCode;

export const parseAlarmAutomationCode = (
  code: string,
): ParsedAlarmAutomationCode | null => {
  if (isByDeviceAutomationCode(code)) {
    return {
      type: 'by-device',
      value: code.replace('by-device:', ''),
    };
  }
  if (isByTypeAutomationCode(code)) {
    return {
      type: 'by-type',
      value: code.replace('by-type:', '') as DeviceEvent['kind'],
    };
  }
  return null;
};

// {
//     "displayName": "Trigger alarm on force-open door events",
//     "enabled": true,
//     "body": {
//         "onEvent": "door-force",
//         "commands": [
//             {
//                 "command": "alarm.set-trigger",
//                 "target": "target.type ==\"alarm\"",
//                 "params": {
//                     "event": "{{event}}",
//                     "onlyIfArmed": "{{device.provider ==\"paxton\"}}"
//                 }
//             }
//         ]
//     }
// }

const encodeComparison = (value: unknown): string => {
  if (typeof value === 'string') {
    return `== ${JSON.stringify(value)}`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `== ${String(value)}`;
  }
  if (Array.isArray(value)) {
    return `in (${value.map(encodeComparison).join(', ')})`;
  }
  if (value === null) {
    return '== null';
  }
  throw new Error(`Unsupported value type for comparison: ${typeof value}`);
};

export const createAlarmRuleBody = (
  eventKind: DeviceEvent['kind'],
  behavior: AlarmBehavior,
  deviceType: DeviceType,
  eventCriteria: AlarmAutomationMetadata['eventCriteria'],
  deviceId?: string,
): AutomationRuleBody => {
  let runIf = 'device.type == "' + deviceType + '"';
  if (deviceId) {
    runIf += ` && device.id == "${deviceId}"`;
  }
  for (const criterion of eventCriteria) {
    runIf += ` && event.${criterion.field} ${encodeComparison(criterion.value)}`;
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
