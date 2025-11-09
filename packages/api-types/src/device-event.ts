import { AnyDeviceEvent } from './events';

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
