import { z } from 'zod';
import { sIoOutputSlotId } from '../../primitives';

// COMMANDS

export const sIoBoardSetOutputCommand = z.object({
  command: z.literal('io-board.set-output'),
  params: z.object({
    output: sIoOutputSlotId,
    value: z.boolean(),
  }),
});

export const ioBoardCommands = {
  'io-board.set-output': sIoBoardSetOutputCommand,
} as const;

export type IoBoardSetOutputCommand = z.infer<typeof sIoBoardSetOutputCommand>;

export type IoBoardCommand = IoBoardSetOutputCommand;
