import { z } from 'zod';

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
