import { DeviceEvent } from '../device-event';

export interface AlarmSearchQueryDto {
  deviceId?: string[];
  kind?: string[];
  userId?: string[];
  personId?: string[];
  timeFrom?: number;
  timeTo?: number;
  offset?: number;
  limit?: number;
}

export interface AlarmSearchItemDto {
  id: string;
  triggeredOn: number;
  acknowledgedOn: number | null;
  acknowledgedBy: string | null;
  triggers: {
    id: string;
    timestamp: number;
    deviceId: string;
    kind: DeviceEvent['kind'];
  }[];
}
