import { z } from 'zod';

/*
- only one alarm is active at the same time. If a new alarm-causing event takes place, the already existing alarm will be amended with the new event rather than creating a new alarm
  (Imagine the case of pirates boarding a ship: the alarm will not be triggered for each pirate, but only once for the whole group of pirates so the UI will show one alarm window and all devices that triggered that alarm listed as they come in, each with its adjacent camera footage if applicable)
- alarms are triggered by events only, so each alarm MUST correspond to one or more events (we shall call those 'alarm triggers')
- upon arming the system, events like 'door-access', 'motion-detected' etc. would trigger an alarm
- in all situations, 'door-force', 'tamper' and other unusual events will trigger alarms regardless of their arm / disarm states
- arming / disarming more than one device will be achieved by an action against a device group (e.g. 'All Devices', 'Top Deck Doors', 'All Doors', 'All Motion Detectors' etc.)
*/

export const ALARM = 'alarm' as const;

// SPECS

export const sAlarmSpecs = z.object({});

export type AlarmSpecs = z.infer<typeof sAlarmSpecs>;

// STATE

export type AlarmStateDto = {
  activeAlarmId: string | null;
  triggeredOn: number | null;
  // event IDs triggering the alarm
  triggeredBy: string[];
  // map of device IDs to their alarm state (armed / disarmed)
  armed: Record<string, boolean>;
  bypassList: string[];
};
