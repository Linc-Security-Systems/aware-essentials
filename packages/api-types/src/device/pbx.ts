import { z } from 'zod';

export const PBX = 'pbx' as const;

// SPECS

export const sPbxSpecs = z.object({
  sipWsUrl: z.string(),
});

export type PbxSpecs = z.infer<typeof sPbxSpecs>;

// COMMANDS

export const sPbxCallCommand = z.object({
  command: z.literal('pbx.call'),
  params: z.object({
    endpoint: z.string().nonempty(),
    soundFile: z.string().nonempty(),
    context: z.string().optional(),
    callerId: z.string().optional(),
  }),
});

export const pbxCommands = {
  'pbx.call': sPbxCallCommand,
} as const;

export type PbxCallCommand = z.infer<typeof sPbxCallCommand>;

export type PbxCommand = PbxCallCommand;

// STATE

// EVENTS
