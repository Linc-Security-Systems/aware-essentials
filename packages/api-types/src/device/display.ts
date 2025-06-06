import { z } from 'zod';

export const DISPLAY = 'display' as const;

// SPECS

export const sDisplaySpecs = z.object({});

export type DisplaySpecs = z.infer<typeof sDisplaySpecs>;

// COMMANDS

export type DisplayTileItem =
  | {
      type: 'camera';
      username: string;
      password: string;
      streams: {
        resolution: string | null;
        rtspUrl: string;
      }[];
    }
  | {
      type: 'empty';
    };

export interface DisplaySetViewCommand {
  command: 'display.set-view';
  params: {
    tile: {
      item: DisplayTileItem[];
    }[];
  };
}

export type DisplayCommand = DisplaySetViewCommand;

// STATE

export interface DisplayStateDto {
  connected: Record<string, boolean>;
}

// EVENTS

export const sDisplayUnitOfflineEvent = z.object({
  kind: z.literal('display-unit-offline'),
});

export type DisplayUnitOfflineEvent = z.infer<typeof sDisplayUnitOfflineEvent>;

//Could report on other events in the future like bad streams, high cpu usage, etc.
