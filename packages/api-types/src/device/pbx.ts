import { z } from 'zod';

export const PBX = 'pbx' as const;

// SPECS

export const sPbxSpecs = z.object({
  sipWsUrl: z.string(),
});

export type PbxSpecs = z.infer<typeof sPbxSpecs>;

// COMMANDS

export interface PbxCallCommand {
  command: 'pbx.call';
  params: {
    endpoint: string;
    soundFile: string;
    context?: string;
    callerId?: string;
  };
}

export type PbxCommand = PbxCallCommand;

// STATE

// EVENTS
