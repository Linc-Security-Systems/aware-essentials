import { AnyDeviceEvent } from '../events';

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
  timeZone?: string; // IANA zone, e.g. 'Africa/Cairo'; used to format times in the PDF export
  timeZoneAsWas?: boolean; // If true, the time zone is treated as it was at the time of the event
}

export type EventSearchItemDto<TEvent extends AnyDeviceEvent = AnyDeviceEvent> =
  {
    id: string;
    timestamp: number;
    deviceId?: string;
    observedBy?: string;
    alarmId: string | null;
  } & TEvent;
