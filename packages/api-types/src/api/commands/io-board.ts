import { z } from 'zod';

// COMMANDS

export const sIoBoardSetOutputCommand = z.object({
  command: z.literal('io-board.set-output'),
  params: z.object({
    output: z.string().nonempty(),
    value: z.boolean(),
  }),
});

export const ioBoardCommands = {
  'io-board.set-output': sIoBoardSetOutputCommand,
} as const;

export type IoBoardSetOutputCommand = z.infer<typeof sIoBoardSetOutputCommand>;

export type IoBoardCommand = IoBoardSetOutputCommand;
